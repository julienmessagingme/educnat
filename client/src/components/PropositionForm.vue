<template>
  <div class="proposition-form">
    <div class="card">
      <div class="header">
        <h2>📋 Temps 1 - Propositions PRD</h2>
        <p>Complétez les informations avant de générer le PDF</p>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div v-else-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <form v-else @submit.prevent="handleSubmit" class="form">
        <!-- Date -->
        <div class="form-section">
          <h3>📅 Date</h3>
          <div class="form-group">
            <label>Date de la proposition *</label>
            <input
              v-model="formData.dateProposition"
              type="date"
              required
              class="date-input"
            />
            <p class="help">Cette date apparaîtra comme : "Temps 1, le {{ formatDateDisplay(formData.dateProposition) }}"</p>
          </div>
        </div>

        <!-- Choix (motifs principaux) -->
        <div class="form-section">
          <h3>✅ Motifs principaux</h3>
          <p class="help">Sélectionnez un ou plusieurs choix</p>

          <div class="checkbox-list">
            <label
              v-for="motif in motifs"
              :key="motif.code"
              class="checkbox-label"
            >
              <input
                type="checkbox"
                :value="motif.code"
                v-model="formData.motifsPrincipaux"
              />
              <span>{{ motif.libelle }}</span>
            </label>
          </div>
        </div>

        <!-- Commentaire libre -->
        <div class="form-section">
          <h3>💬 Commentaire libre</h3>
          <div class="form-group">
            <textarea
              v-model="formData.commentaire"
              rows="6"
              placeholder="Ajoutez vos observations, recommandations, ou toute autre information pertinente..."
              class="textarea"
            ></textarea>
            <p class="help">Ce commentaire apparaîtra dans le rectangle Temps 1 du PDF</p>
          </div>
        </div>

        <!-- Temps 2 -->
        <div class="section-divider">
          <h2>📋 Temps 2 - Proposition PRD</h2>
        </div>

        <!-- Évaluation de la situation -->
        <div class="form-section">
          <h3>📊 Évaluation de la situation</h3>
          <p class="help">Sélectionnez une ou plusieurs options (des croix apparaîtront dans le PDF)</p>

          <div class="checkbox-list">
            <label
              v-for="option in evaluationOptions"
              :key="option.code"
              class="checkbox-label"
            >
              <input
                type="checkbox"
                :value="option.code"
                v-model="formData.evaluationSituation"
              />
              <span>{{ option.libelle }}</span>
            </label>
          </div>
        </div>

        <!-- Date Temps 2 -->
        <div class="form-section">
          <h3>📅 Date</h3>
          <div class="form-group">
            <label>Date de la proposition Temps 2</label>
            <input
              v-model="formData.temps2Date"
              type="date"
              class="date-input"
            />
            <p class="help">Cette date apparaîtra comme : "Temps 2, le {{ formatDateDisplay(formData.temps2Date) }}"</p>
          </div>
        </div>

        <!-- Commentaire Temps 2 -->
        <div class="form-section">
          <h3>💬 Commentaire libre Temps 2</h3>
          <div class="form-group">
            <textarea
              v-model="formData.temps2Commentaire"
              rows="6"
              placeholder="Ajoutez vos observations pour le Temps 2..."
              class="textarea"
            ></textarea>
            <p class="help">Ce commentaire apparaîtra dans le rectangle Temps 2 du PDF</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn-back" @click="handleBack">
            ← Revenir en arrière
          </button>
          <button type="button" class="btn-secondary" @click="handleCancel">
            Annuler
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="!saving">✅ Valider et générer le PDF</span>
            <span v-else>⏳ Génération en cours...</span>
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
  ficheId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['completed', 'cancel', 'back'])

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const motifs = ref([])

const evaluationOptions = [
  { code: 'STABILISATION_CIRCO', libelle: 'Stabilisation suivi circonscription' },
  { code: 'STABILISATION_PRD', libelle: 'Stabilisation suivi PRD' },
  { code: 'ACTIONS_COMPLEMENTAIRES', libelle: 'Actions complémentaires' },
  { code: 'EQUIPE_TECHNIQUE', libelle: 'Equipe technique' },
  { code: 'SITUATION_CLOTUREE', libelle: 'Situation clôturée' }
]

// Les 10 choix PRD avec placeholder {prenom_enfant}
const choixPRD = [
  { code: 'CHOIX_1', libelle: "Le PRD propose le soutien de l'Équipe Mobile d'appui à la scolarité, EMAS33, pour répondre aux besoins de conseils à la communauté éducative afin d'accompagner la prise en charge des besoins éducatifs particuliers {prenom_enfant}…..L'EMAScol prendra contact à l'établissement pour déterminer les modalités d'action" },
  { code: 'CHOIX_2', libelle: "Le PRD propose le soutien de l'Equipe Mobile d'appui à la scolarité pour accompagner la communauté éducative dans l'élaboration de stratégies éducatives et comportementales adaptées aux besoins {prenom_enfant}. L'EMAScol prendra contact à l'équipe pour déterminer les modalités d'action." },
  { code: 'CHOIX_3', libelle: "Le PRD propose la visite de Madame Claire MAYOR TANNIERE, Professeure ressource TSA SDEI, qui prendra contact avec l'équipe éducative pour déterminer les modalités de sa première visite." },
  { code: 'CHOIX_4', libelle: "Le PRD propose la visite de Madame Campagne, Professeure ressource TND  SDEI, qui prendra contact avec l'équipe éducative pour déterminer les modalités de sa première visite." },
  { code: 'CHOIX_5', libelle: "Après étude de la situation {prenom_enfant}, le PRD propose un accompagnement conjoint, associant l'expertise du professeur ressource TND et l'accompagnement de l'EMAS. L'EMAS, en lien avec Mme Campagne ( PR TND ), prendra directement contact avec l'école." },
  { code: 'CHOIX_6', libelle: "Le PRD propose la visite d'CPD du  SDEI, qui prendra contact avec l'équipe éducative pour déterminer les modalités de sa première visite." },
  { code: 'CHOIX_7', libelle: "Après étude de la situation {prenom_enfant}, le PRD propose un accompagnement conjoint, associant l'expertise d'un CPD du SDEI et l'accompagnement de l'EMAS. L'EMAS, en lien avec avec  le cpd du SDEI prendra directement contact avec l'école." },
  { code: 'CHOIX_8', libelle: "Afin d'accompagner au mieux la situation {prenom_enfant}. le prd propose un accompagnement par le pole TSA / TND avec l'appui de l'EMAS qui sera à même d'intervenir rapidement. L' équipe de l'EMAS prendra contact avec l'école, tout comme le pole TSA / TND." },
  { code: 'CHOIX_9', libelle: "Afin d'accélerer la demande de prise en charge en ESMS, le PRD propose la rédaction d'une fiche RAPT ( réponse accompagnée pour tous ) par l'enseignant référent du secteur à destination de l'IEN SDEI." },
  { code: 'CHOIX_10', libelle: "Afin d'accompagner au mieux la situation {prenom_enfant} le prd propose un accompagnement de l'AESH par l'AESH référente TSA, Mme Caboblanco, qui prendra contact avec l'école et l'aesh afin de définir des modalités d'intervention." }
]

/**
 * Retourne "d'Prénom" si voyelle/h, "de Prénom" sinon
 */
function dePrenom(prenom) {
  if (!prenom) return ''
  const voyelles = 'aeiouyéèêëâîôûùüh'
  const firstChar = prenom.charAt(0).toLowerCase()
  if (voyelles.includes(firstChar)) {
    return `d'${prenom}`
  }
  return `de ${prenom}`
}

const formData = ref({
  dateProposition: new Date().toISOString().split('T')[0], // Date du jour par défaut
  motifsPrincipaux: [],
  evaluationSituation: [],
  commentaire: '',
  temps2Date: '',
  temps2Commentaire: ''
})

onMounted(async () => {
  try {
    // Charger la fiche pour récupérer le prénom de l'enfant
    const ficheResult = await api.getFiche(props.ficheId)
    const fiche = ficheResult.fiche || ficheResult
    const prenom = fiche.prenom || ''
    const prenomFormate = dePrenom(prenom)

    // Injecter le prénom dans les libellés des choix
    motifs.value = choixPRD.map(choix => ({
      code: choix.code,
      libelle: choix.libelle.replace(/\{prenom_enfant\}/g, prenomFormate)
    }))

  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  // Vérifier qu'au moins un motif est sélectionné
  if (formData.value.motifsPrincipaux.length === 0) {
    alert('Veuillez sélectionner au moins un motif principal')
    return
  }

  saving.value = true
  error.value = null

  try {
    // Sauvegarder la proposition
    const propositionData = {
      ficheId: props.ficheId,
      temps: 1,
      dateProposition: formData.value.dateProposition,
      motifsPrincipaux: formData.value.motifsPrincipaux,
      evaluationSituation: formData.value.evaluationSituation,
      commentaire: formData.value.commentaire,
      temps2Date: formData.value.temps2Date,
      temps2Commentaire: formData.value.temps2Commentaire
    }

    await api.saveProposition(propositionData)

    // Générer le PDF
    const pdfResult = await api.generatePDF(props.ficheId)

    if (pdfResult.success) {
      emit('completed', pdfResult.pdfUrl)
    } else {
      error.value = pdfResult.error || 'Erreur lors de la génération du PDF'
    }

  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  emit('cancel')
}

function handleBack() {
  emit('back')
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}
</script>

<style scoped>
.proposition-form {
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
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.header h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.header p {
  color: #666;
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

.form {
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

.date-input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  max-width: 200px;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
}

.help {
  font-size: 0.85rem;
  color: #999;
  margin: 0;
}

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.checkbox-label:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.checkbox-label span {
  flex: 1;
  font-size: 1rem;
}

.textarea {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
}

.textarea:focus {
  outline: none;
  border-color: #667eea;
}

.section-divider {
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 3px solid #667eea;
}

.section-divider h2 {
  font-size: 1.5rem;
  color: #333;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #f0f0f0;
}

.btn-primary,
.btn-secondary,
.btn-back {
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

.btn-back {
  background: #f5f5f5;
  color: #333;
  border: 2px solid #ddd;
}

.btn-back:hover {
  background: #e8e8e8;
  border-color: #bbb;
}
</style>
