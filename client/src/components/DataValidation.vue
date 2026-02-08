<template>
  <div class="data-validation">
    <div class="card">
      <div class="header">
        <h2>✏️ Validation des données extraites</h2>
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
        <!-- Informations élève -->
        <section class="form-section">
          <h3>👤 Informations Élève</h3>

          <div class="form-row">
            <div class="form-group">
              <label>Nom *</label>
              <input
                v-model="formData.nom"
                type="text"
                required
                placeholder="JAULIN"
              />
            </div>

            <div class="form-group">
              <label>Prénom *</label>
              <input
                v-model="formData.prenom"
                type="text"
                required
                placeholder="Lalita"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Date de naissance</label>
              <input
                v-model="formData.dateNaissance"
                type="text"
                placeholder="09/07/2018"
              />
              <span class="help">Format: JJ/MM/AAAA</span>
            </div>

            <div class="form-group">
              <label>Classe</label>
              <input
                v-model="formData.classe"
                type="text"
                placeholder="CE1"
              />
            </div>
          </div>
        </section>

        <!-- Établissement -->
        <section class="form-section">
          <h3>🏫 Établissement</h3>

          <div class="form-group">
            <label>Nom de l'établissement</label>
            <input
              v-model="formData.etablissementNom"
              type="text"
              placeholder="Hector Ducamp"
            />
          </div>

          <div class="form-group">
            <label>Adresse</label>
            <input
              v-model="formData.etablissementAdresse"
              type="text"
              placeholder="82 avenue de la République Saint-Loubès"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input
                v-model="formData.etablissementEmail"
                type="email"
                placeholder="ce.0331174X@ac-bordeaux.fr"
              />
            </div>

            <div class="form-group">
              <label>Téléphone</label>
              <input
                v-model="formData.etablissementTel"
                type="text"
                placeholder="0556204160"
              />
            </div>
          </div>
        </section>

        <!-- Origine de la saisine -->
        <section class="form-section">
          <h3>📝 Origine de la Saisine</h3>

          <div class="form-row">
            <div class="form-group">
              <label>Type *</label>
              <select v-model="formData.origineSaisine" required>
                <option value="">-- Sélectionner --</option>
                <option value="IEN">IEN</option>
                <option value="Chef établissement">Chef d'établissement</option>
                <option value="DSDEN">DSDEN</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div class="form-group">
              <label>Nom de la personne</label>
              <input
                v-model="formData.origineNom"
                type="text"
                placeholder="Mme Marie-Noëlle CHRISTOPHE"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Date de la demande</label>
              <input
                v-model="formData.dateDemande"
                type="text"
                placeholder="15/02/2026"
              />
              <span class="help">Format: JJ/MM/AAAA</span>
            </div>
          </div>
        </section>

        <!-- Demandes -->
        <section class="form-section">
          <h3>📋 Demandes Détectées</h3>
          <p class="help">Cochez les demandes concernées par cette saisine</p>

          <div class="checkbox-grid">
            <label
              v-for="type in typesDemande"
              :key="type.code"
              class="checkbox-label"
            >
              <input
                type="checkbox"
                :value="type.code"
                v-model="formData.demandes"
              />
              <span>{{ type.libelle }}</span>
            </label>
          </div>
        </section>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="handleCancel">
            Annuler
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="!saving">✅ Valider et enregistrer</span>
            <span v-else>⏳ Enregistrement...</span>
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

const emit = defineEmits(['validated', 'cancel'])

const loading = ref(true)
const saving = ref(false)
const error = ref(null)

// Fallback : les 11 types de demandes en dur (si la BDD est vide)
const TYPES_DEMANDE_DEFAUT = [
  { code: 'SENSIBILISATION', libelle: 'Demande de sensibilisation, formation aux équipes' },
  { code: 'POSTURE_PRO', libelle: 'Appui et conseil aux enseignants : Posture professionnelle' },
  { code: 'GESTES_PRO', libelle: 'Appui et conseil aux enseignants : Gestes professionnels' },
  { code: 'PEDAGOGIE', libelle: 'Appui et conseil aux enseignants : Pédagogie auprès des élèves' },
  { code: 'AMENAGEMENT', libelle: 'Appui et conseil aux enseignants : Aménagement de l\'espace classe' },
  { code: 'EXPERTISE_COMPORTEMENT', libelle: 'Appui et conseil aux enseignants : Expertise troubles du comportement' },
  { code: 'EXPERTISE_TSA_PEDAGOGIE', libelle: 'Appui et conseil aux enseignants : Expertise TSA apports pédagogiques' },
  { code: 'EXPERTISE_TSA_AESH', libelle: 'Appui et conseil aux enseignants : Expertise TSA accompagnement AESH' },
  { code: 'EXPERTISE_NEURODEV', libelle: 'Appui et conseil aux enseignants : Expertise trouble neurodév.' },
  { code: 'COMMUNAUTE_EDUCATIVE', libelle: 'Appui et conseil à la communauté éducative' },
  { code: 'PARCOURS_SCOLAIRE', libelle: 'Aide à l\'élaboration du parcours scolaire et/ou de soin' }
]

const typesDemande = ref(TYPES_DEMANDE_DEFAUT)
const demandesDebug = ref('')

const formData = ref({
  nom: '',
  prenom: '',
  dateNaissance: '',
  classe: '',
  etablissementNom: '',
  etablissementAdresse: '',
  etablissementEmail: '',
  etablissementTel: '',
  origineSaisine: '',
  origineNom: '',
  situationRemontee: '',
  dateDemande: '',
  demandes: []
})

onMounted(async () => {
  try {
    // Les 11 types de demandes sont fixes (définis dans TYPES_DEMANDE_DEFAUT)
    // Pas besoin de charger depuis l'API

    // Charger la fiche
    const ficheResult = await api.getFiche(props.ficheId)
    const fiche = ficheResult.fiche

    // Parser les demandes si c'est une chaîne JSON
    let demandes = fiche.demandes || fiche.demandes_formulees || []
    if (typeof demandes === 'string') {
      try { demandes = JSON.parse(demandes) } catch { demandes = [] }
    }
    if (!Array.isArray(demandes)) {
      demandes = []
    }

    demandesDebug.value = JSON.stringify(demandes)

    // Remplir le formulaire avec les données extraites
    formData.value = {
      nom: fiche.nom || '',
      prenom: fiche.prenom || '',
      dateNaissance: fiche.date_naissance || '',
      classe: fiche.classe || '',
      etablissementNom: fiche.etablissement_nom || '',
      etablissementAdresse: fiche.etablissement_adresse || '',
      etablissementEmail: fiche.etablissement_email || '',
      etablissementTel: fiche.etablissement_tel || '',
      origineSaisine: fiche.origine_saisine || '',
      origineNom: fiche.origine_nom || '',
      situationRemontee: fiche.situation_remontee_par || '',
      dateDemande: fiche.date_demande || '',
      demandes: demandes
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
    const result = await api.validateFiche(props.ficheId, formData.value)

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
.data-validation {
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
.form-group select {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.help {
  font-size: 0.85rem;
  color: #999;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
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
  font-size: 0.95rem;
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
