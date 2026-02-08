<template>
  <div class="file-upload">
    <div class="card">
      <h2>📤 Upload de fichier</h2>
      <p class="subtitle">Glissez-déposez votre fiche de saisine PRD (PDF ou DOCX)</p>

      <div
        class="dropzone"
        :class="{ 'dragover': isDragging, 'uploading': isUploading }"
        @drop.prevent="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.docx"
          @change="handleFileSelect"
          style="display: none"
        />

        <div v-if="!isUploading" class="dropzone-content">
          <div class="icon">📁</div>
          <p class="main-text">
            Glissez votre fichier ici<br>
            ou cliquez pour sélectionner
          </p>
          <p class="help-text">PDF ou DOCX • Max 10 MB</p>
        </div>

        <div v-else class="uploading-state">
          <div class="spinner"></div>
          <p>Upload en cours...</p>
          <p class="small">🤖 Extraction IA des données...</p>
        </div>
      </div>

      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <div v-if="selectedFile && !isUploading" class="selected-file">
        <div class="file-info">
          <span class="file-icon">📄</span>
          <div>
            <div class="file-name">{{ selectedFile.name }}</div>
            <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
          </div>
        </div>
        <button class="btn-primary" @click="uploadFile">
          Analyser avec l'IA
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'

const emit = defineEmits(['uploaded'])

const fileInput = ref(null)
const selectedFile = ref(null)
const isDragging = ref(false)
const isUploading = ref(false)
const error = ref(null)

function triggerFileInput() {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

function handleDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

function validateAndSetFile(file) {
  error.value = null

  // Vérifier le type
  const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!validTypes.includes(file.type)) {
    error.value = 'Type de fichier non supporté. Utilisez PDF ou DOCX.'
    return
  }

  // Vérifier la taille (10MB)
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Fichier trop volumineux. Maximum 10 MB.'
    return
  }

  selectedFile.value = file
}

async function uploadFile() {
  if (!selectedFile.value) return

  isUploading.value = true
  error.value = null

  try {
    const result = await api.uploadFile(selectedFile.value)

    if (result.success) {
      emit('uploaded', result.ficheId)
    } else {
      error.value = result.error || 'Erreur lors de l\'upload'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'upload'
  } finally {
    isUploading.value = false
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.file-upload {
  max-width: 600px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
}

.dropzone {
  border: 3px dashed #ccc;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.dropzone:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.dropzone.dragover {
  border-color: #667eea;
  background: #e8efff;
  transform: scale(1.02);
}

.dropzone.uploading {
  cursor: not-allowed;
  opacity: 0.7;
}

.dropzone-content .icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.main-text {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.help-text {
  color: #999;
  font-size: 0.9rem;
}

.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.uploading-state .small {
  font-size: 0.9rem;
  color: #666;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
}

.selected-file {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.file-icon {
  font-size: 2rem;
}

.file-name {
  font-weight: 600;
  color: #333;
}

.file-size {
  font-size: 0.9rem;
  color: #666;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}
</style>
