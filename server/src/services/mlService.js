const axios = require('axios');
const FormData = require('form-data');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const analyzeAudioWithMLService = async (fileBuffer, filename, mimetype) => {
  try {
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: filename || 'audio.wav',
      contentType: mimetype || 'audio/wav'
    });

    const response = await axios.post(`${ML_SERVICE_URL}/analyze`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000 // 30 second timeout for CPU inference
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || `ML Service error (${error.response.status})`);
    } else if (error.request) {
      throw new Error(`ML Service unreachable at ${ML_SERVICE_URL}. Ensure ml-service is running.`);
    } else {
      throw new Error(`Failed to process audio with ML Service: ${error.message}`);
    }
  }
};

module.exports = { analyzeAudioWithMLService };
