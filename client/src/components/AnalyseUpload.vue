<template>
  <div class="analyse-upload">
    <div class="card">
      <h2>📤 Upload de documents</h2>
      <p class="subtitle">Glissez-déposez 1 à 10 fichiers (PDF ou DOCX) pour générer la fiche d'analyse</p>

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
          multiple
          @change="handleFileSelect"
          style="display: none"
        />

        <div v-if="!isUploading" class="dropzone-content">
          <div class="icon">📁</div>
          <p class="main-text">
            Glissez vos fichiers ici<br>
            ou cliquez pour sélectionner
          </p>
          <p class="help-text">PDF ou DOCX • Max 10 fichiers • Max 10 MB chacun</p>
        </div>

        <div v-else class="uploading-state">
          <div class="spinner"></div>
          <p>Analyse en cours...</p>
          <p class="small">🤖 Extraction IA des données depuis {{ selectedFiles.length }} fichier(s)...</p>
        </div>
      </div>

      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <div v-if="selectedFiles.length > 0 && !isUploading" class="selected-files">
        <h3>{{ selectedFiles.length }} fichier(s) sélectionné(s)</h3>
        <ul class="file-list">
          <li v-for="(file, index) in selectedFiles" :key="index" class="file-item">
            <div class="file-info">
              <span class="file-icon">📄</span>
              <div>
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
              </div>
            </div>
            <button class="btn-remove" @click="removeFile(index)" title="Retirer">✕</button>
          </li>
        </ul>
        <button class="btn-primary" @click="uploadFiles">
          🤖 Analyser avec l'IA ({{ selectedFiles.length }} fichier{{ selectedFiles.length > 1 ? 's' : '' }})
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
const selectedFiles = ref([])
const isDragging = ref(false)
const isUploading = ref(false)
const error = ref(null)

function triggerFileInput() {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files || [])
  addFiles(files)
  // Reset input pour pouvoir resélectionner les mêmes fichiers
  if (fileInput.value) fileInput.value.value = ''
}

function handleDrop(event) {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files || [])
  addFiles(files)
}

function addFiles(files) {
  error.value = null

  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]

  for (const file of files) {
    if (!validTypes.includes(file.type)) {
      error.value = `Type non supporté: ${file.name}. Utilisez PDF ou DOCX.`
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      error.value = `Fichier trop volumineux: ${file.name}. Maximum 10 MB.`
      return
    }
  }

  const total = selectedFiles.value.length + files.length
  if (total > 10) {
    error.value = 'Maximum 10 fichiers autorisés.'
    return
  }

  selectedFiles.value = [...selectedFiles.value, ...files]
}

function removeFile(index) {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index)
}

async function uploadFiles() {
  if (selectedFiles.value.length === 0) return

  isUploading.value = true
  error.value = null

  try {
    const result = await api.uploadAnalyseFiles(selectedFiles.value)

    if (result.success) {
      emit('uploaded', result.analyseId)
    } else {
      error.value = result.error || 'Erreur lors de l\'analyse'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de l\'analyse'
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
.analyse-upload {
  max-width: 700px;
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

.selected-files {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.selected-files h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.file-icon {
  font-size: 1.5rem;
}

.file-name {
  font-weight: 600;
  color: #333;
}

.file-size {
  font-size: 0.85rem;
  color: #666;
}

.btn-remove {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #999;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fee;
  color: #c33;
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
  width: 100%;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
