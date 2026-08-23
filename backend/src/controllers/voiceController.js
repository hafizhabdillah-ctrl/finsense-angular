const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const prisma = require('../config/prisma');

// Helper: normalisasi string (aman untuk input non-string)
const normalize = (str) =>
  String(str || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();

/**
 * Mencari produk di database berdasarkan nama prediksi dan alternatif top3
 * @param {string} predictedName - Nama produk hasil prediksi model
 * @param {Array} top3Alternatives - Alternatif top3 dari model (opsional)
 * @returns {Promise<Object|null>} Produk yang cocok atau null
 */
async function findProductByPrediction(predictedName, top3Alternatives = []) {
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, price: true },
  });
  if (!allProducts.length) return null;

  const normalizedPredicted = normalize(predictedName);
  const normalizedAlternatives = (top3Alternatives || []).map((alt) =>
    normalize(alt),
  );

  // 1. Coba kecocokan persis (exact match)
  for (const prod of allProducts) {
    const normalizedProd = normalize(prod.name);
    if (normalizedProd === normalizedPredicted) return prod;
    if (normalizedAlternatives.includes(normalizedProd)) return prod;
  }

  // 2. Fallback: partial match berdasarkan kata (overlap)
  const predictedWords = new Set(normalizedPredicted.split(/\s+/));
  let bestMatch = null;
  let bestOverlap = 0;
  for (const prod of allProducts) {
    const prodNorm = normalize(prod.name);
    const prodWords = new Set(prodNorm.split(/\s+/));
    const overlap = [...predictedWords].filter((w) => prodWords.has(w)).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = prod;
    }
  }
  return bestOverlap >= 1 ? bestMatch : null;
}

/**
 * Mencari produk dari transkrip (fallback saat confidence rendah atau produk tidak ditemukan)
 * @param {string} transcript - Teks transkrip
 * @returns {Promise<Object|null>} Produk yang cocok atau null
 */
async function findProductFromTranscript(transcript) {
  if (!transcript) return null;

  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, price: true },
  });
  if (!allProducts.length) return null;

  const transNorm = normalize(transcript);
  const transWords = new Set(transNorm.split(/\s+/));

  let bestMatch = null;
  let bestOverlap = 0;
  for (const prod of allProducts) {
    const prodNorm = normalize(prod.name);
    const prodWords = new Set(prodNorm.split(/\s+/));
    const overlap = [...transWords].filter((w) => prodWords.has(w)).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = prod;
    }
  }
  return bestOverlap >= 1 ? bestMatch : null;
}

exports.processVoice = async (req, res) => {
  let audioFilePath = null;

  try {
    const audioFile = req.file;
    const transcript = req.body.transcript || '';
    let jumlah = parseInt(req.body.jumlah) || 0;

    if (!audioFile) {
      return res
        .status(400)
        .json({ success: false, message: 'No audio file uploaded' });
    }

    audioFilePath = audioFile.path;

    // Siapkan FormData untuk FastAPI
    const form = new FormData();
    form.append('audio', fs.createReadStream(audioFilePath), {
      filename: audioFile.originalname || 'recording.webm',
      contentType: audioFile.mimetype,
    });
    form.append('transcript', transcript);
    if (jumlah > 0) form.append('jumlah', String(jumlah));

    const fastApiUrl =
      process.env.AI_SERVICE_URL || 'http://localhost:8000/voice';
    console.log(`[Voice] Calling FastAPI: ${fastApiUrl}`);

    const fastApiResponse = await axios.post(fastApiUrl, form, {
      headers: { ...form.getHeaders() },
      timeout: 60000,
    });

    // Hapus file temporary
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }

    // Data dari FastAPI (dengan nilai default aman)
    const {
      produk = '',
      produk_conf = 0,
      produk_top3 = [],
      jumlah: qty,
      unit_price = 0,
      harga: hargaTotal,
    } = fastApiResponse.data;

    const finalJumlah = qty || jumlah || 1;
    const finalHarga = hargaTotal || unit_price * finalJumlah;

    // Cari produk di database berdasarkan prediksi & alternatif
    let matchedProduct = await findProductByPrediction(produk, produk_top3);
    let usedFallback = false;
    let finalProductName = produk;

    // Jika confidence rendah (<70%) atau produk tidak ditemukan, coba fallback dari transkrip
    if (produk_conf < 0.7 || !matchedProduct) {
      const fallbackProduct = await findProductFromTranscript(transcript);
      if (fallbackProduct) {
        finalProductName = fallbackProduct.name;
        matchedProduct = fallbackProduct;
        usedFallback = true;
        console.log(`[Voice] Fallback used: transcript → ${finalProductName}`);
      }
    }

    // Kirim response
    res.json({
      success: true,
      produk: finalProductName,
      produk_conf: produk_conf,
      produk_top3: produk_top3,
      jumlah: finalJumlah,
      harga: finalHarga,
      matchedProduct: matchedProduct
        ? {
            id: matchedProduct.id,
            name: matchedProduct.name,
            price: matchedProduct.price,
          }
        : null,
      usedFallback,
    });

    console.log('[Voice] Processed successfully:', {
      produk: finalProductName,
      jumlah: finalJumlah,
      harga: finalHarga,
      matchedProduct: matchedProduct ? matchedProduct.name : 'No match',
      usedFallback,
    });
  } catch (error) {
    console.error('[Voice] Error:', error.message);
    if (error.response) {
      console.error('[Voice] FastAPI response error:', error.response.data);
    }

    // Hapus file temporary jika masih ada
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      try {
        fs.unlinkSync(audioFilePath);
      } catch (e) {}
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process voice',
      detail: error.message,
    });
  }
};
