<template>
  <div class="analyse-validation">
    <div class="card">
      <div class="header">
        <h2>✏️ Validation de la fiche d'analyse</h2>
        <p class="ai-badge">🤖 Extrait par Intelligence Artificielle</p>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement des données...</p>
      </div>

      <div v-else-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <form v-else @submit.prevent="handleSubmit" class="validation-form">
        <!-- Section Identification -->
        <section class="form-section">
          <h3>👤 Identification</h3>

          <div class="form-row">
            <div class="form-group">
              <label>Nom de l'enfant</label>
              <input v-model="formData.nomEnfant" type="text" placeholder="NOM" />
            </div>
            <div class="form-group">
              <label>Prénom de l'enfant</label>
              <input v-model="formData.prenomEnfant" type="text" placeholder="Prénom" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Date de naissance</label>
              <input v-model="formData.dateDeNaissance" type="text" placeholder="JJ/MM/AAAA" />
            </div>
            <div class="form-group">
              <label>Classe</label>
              <input v-model="formData.classe" type="text" placeholder="CE1, CM2..." />
            </div>
          </div>

          <div class="form-group">
            <label>Etablissement scolaire</label>
            <input v-model="formData.etablissementScolaire" type="text" placeholder="Nom de l'établissement" />
          </div>
        </section>

        <!-- Section Analyse -->
        <section class="form-section">
          <h3>📋 Analyse</h3>

          <div v-for="field in analyseFields" :key="field.key" class="form-group">
            <label>{{ field.label }}</label>
            <textarea
              v-model="formData[field.key]"
              :placeholder="field.placeholder"
              rows="3"
            ></textarea>
            <span class="word-count" :class="{ 'over-limit': wordCount(formData[field.key]) > 100 }">
              {{ wordCount(formData[field.key]) }}/100 mots
            </span>
          </div>
        </section>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="handleCancel">
            Annuler
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="!saving">✅ Valider et générer le PDF</span>
            <span v-else>⏳ Validation...</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const props = defineProps({
  analyseId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['validated', 'cancel'])

const loading = ref(true)
const saving = ref(false)
const error = ref(null)

const analyseFields = [
  { key: 'problematique', label: 'Problématique', placeholder: 'Synthèse de la problématique principale...' },
  { key: 'motif', label: 'Motif', placeholder: 'Motif de la demande / saisine...' },
  { key: 'historique', label: 'Historique', placeholder: 'Historique de la situation...' },
  { key: 'situation', label: 'Situation actuelle', placeholder: 'Description de la situation actuelle...' },
  { key: 'partenaires', label: 'Partenaires', placeholder: 'Partenaires impliqués...' },
  { key: 'contexteFamilial', label: 'Contexte familial', placeholder: 'Contexte familial de l\'élève...' },
  { key: 'difficultes', label: 'Difficultés', placeholder: 'Difficultés identifiées...' },
  { key: 'pointsAppui', label: 'Points d\'appui', placeholder: 'Points d\'appui et ressources positives...' },
  { key: 'enClasse', label: 'En classe', placeholder: 'Comportement et fonctionnement en classe...' },
  { key: 'avecLaCommunaute', label: 'Avec la communauté', placeholder: 'Relations avec la communauté éducative...' },
  { key: 'demandeFormulee', label: 'Demande formulée', placeholder: 'Demande formulée par l\'équipe / la famille...' }
]

const formData = ref({
  nomEnfant: '',
  prenomEnfant: '',
  dateDeNaissance: '',
  etablissementScolaire: '',
  classe: '',
  problematique: '',
  motif: '',
  historique: '',
  situation: '',
  partenaires: '',
  contexteFamilial: '',
  difficultes: '',
  pointsAppui: '',
  enClasse: '',
  avecLaCommunaute: '',
  demandeFormulee: ''
})

function wordCount(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

onMounted(async () => {
  try {
    const result = await api.getAnalyse(props.analyseId)
    const a = result.analyse

    formData.value = {
      nomEnfant: a.nom_enfant || '',
      prenomEnfant: a.prenom_enfant || '',
      dateDeNaissance: a.date_de_naissance || '',
      etablissementScolaire: a.etablissement_scolaire || '',
      classe: a.classe || '',
      problematique: a.problematique || '',
      motif: a.motif || '',
      historique: a.historique || '',
      situation: a.situation || '',
      partenaires: a.partenaires || '',
      contexteFamilial: a.contexte_familial || '',
      difficultes: a.difficultes || '',
      pointsAppui: a.points_appui || '',
      enClasse: a.en_classe || '',
      avecLaCommunaute: a.avec_la_communaute || '',
      demandeFormulee: a.demande_formulee || ''
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  saving.value = true
  error.value = null

  try {
    const result = await api.validateAnalyse(props.analyseId, formData.value)

    if (result.success) {
      emit('validated')
    } else {
      error.value = result.error || 'Erreur lors de la validation'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la validation'
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<style scoped>
.analyse-validation {
  max-width: 900px;
  margin: 0 auto;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.header h2 {
  font-size: 1.5rem;
  color: #333;
}

.ai-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  padding: 1rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
}

.validation-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section h3 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.3s;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.word-count {
  font-size: 0.8rem;
  color: #999;
  text-align: right;
}

.word-count.over-limit {
  color: #e74c3c;
  font-weight: 600;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #f0f0f0;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
