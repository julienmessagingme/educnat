<template>
  <!-- Écran de login -->
  <Login v-if="!isLoggedIn" @logged-in="onLoggedIn" />

  <!-- Application principale -->
  <div v-else class="app">
    <header class="header">
      <div class="container header-row">
        <div>
          <h1>📋 PRD Automation</h1>
          <p>Traitement automatisé des fiches de saisine PRD</p>
        </div>
        <button class="btn-logout" @click="handleLogout">
          Déconnexion
        </button>
      </div>
    </header>

    <nav class="tabs">
      <div class="container">
        <button
          class="tab"
          :class="{ active: currentTab === 'upload' }"
          @click="currentTab = 'upload'"
        >
          📤 Upload
        </button>
        <button
          class="tab"
          :class="{ active: currentTab === 'history' }"
          @click="currentTab = 'history'"
        >
          📚 Historique
        </button>
      </div>
    </nav>

    <main class="container main-content">
      <!-- Onglet Upload -->
      <div v-if="currentTab === 'upload'">
        <!-- Étape 1: Upload du fichier -->
        <FileUpload
          v-if="!uploadedFicheId"
          @uploaded="handleFileUploaded"
        />

        <!-- Étape 2: Validation des données extraites -->
        <DataValidation
          v-else-if="uploadedFicheId && !isValidated && !pdfGenerated"
          :ficheId="uploadedFicheId"
          @validated="handleValidated"
          @cancel="resetUpload"
        />

        <!-- Étape 3: Formulaire Temps 1 (Propositions PRD) -->
        <PropositionForm
          v-else-if="uploadedFicheId && isValidated && !pdfGenerated"
          :ficheId="uploadedFicheId"
          @completed="handlePropositionCompleted"
          @cancel="resetUpload"
          @back="handleBackFromProposition"
        />

        <!-- Étape 4: Preview du PDF généré -->
        <PDFPreview
          v-else-if="uploadedFicheId && pdfGenerated"
          :ficheId="uploadedFicheId"
          :pdfUrl="pdfUrl"
          @finish="handleFinishPreview"
          @back="handleBackFromPreview"
        />
      </div>

      <!-- Onglet Historique -->
      <FichesList v-if="currentTab === 'history'" />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Login from './components/Login.vue'
import FileUpload from './components/FileUpload.vue'
import DataValidation from './components/DataValidation.vue'
import PropositionForm from './components/PropositionForm.vue'
import PDFPreview from './components/PDFPreview.vue'
import FichesList from './components/FichesList.vue'
import api from './services/api'

const isLoggedIn = ref(!!localStorage.getItem('token'))

function onLoggedIn() {
  isLoggedIn.value = true
}

async function handleLogout() {
  await api.logout()
  isLoggedIn.value = false
}

const currentTab = ref('upload')
const uploadedFicheId = ref(null)
const isValidated = ref(false)
const pdfGenerated = ref(false)
const pdfUrl = ref('')

function handleFileUploaded(ficheId) {
  uploadedFicheId.value = ficheId
  isValidated.value = false
  pdfGenerated.value = false
}

function handleValidated() {
  // Passer à l'étape Temps 1
  isValidated.value = true
}

function handleBackFromProposition() {
  // Revenir à la validation des données
  isValidated.value = false
}

function handlePropositionCompleted(returnedPdfUrl) {
  // PDF généré, afficher la preview
  pdfUrl.value = returnedPdfUrl
  pdfGenerated.value = true
}

function handleFinishPreview() {
  // Terminer et aller sur l'historique
  currentTab.value = 'history'
  uploadedFicheId.value = null
  isValidated.value = false
  pdfGenerated.value = false
  pdfUrl.value = ''
}

function handleBackFromPreview() {
  // Revenir au formulaire Temps 1
  pdfGenerated.value = false
  pdfUrl.value = ''
}

function resetUpload() {
  uploadedFicheId.value = null
  isValidated.value = false
  pdfGenerated.value = false
  pdfUrl.value = ''
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-logout {
  padding: 0.5rem 1.2rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
}

.header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.header p {
  opacity: 0.9;
  font-size: 1.1rem;
}

.tabs {
  background: white;
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tabs .container {
  display: flex;
  gap: 0;
}

.tab {
  padding: 1rem 2rem;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.tab:hover {
  background: #f5f5f5;
  color: #333;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  font-weight: 600;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main-content {
  padding: 2rem 1rem;
}
</style>
