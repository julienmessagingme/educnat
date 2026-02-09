<template>
  <div class="fiches-list">
    <div class="card">
      <div class="header">
        <div class="header-top">
          <h2>📚 Historique des fiches</h2>
          <button
            class="btn-purge"
            @click="purgeAll"
            :disabled="fiches.length === 0"
          >
            🗑️ Purger l'historique
          </button>
        </div>
        <div class="filters">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="🔍 Rechercher..."
            class="search-input"
            @input="handleSearch"
          />
          <select v-model="statusFilter" @change="loadFiches" class="status-filter">
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="validated">Validé</option>
            <option value="completed">Terminé</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div v-else-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <div v-else-if="fiches.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Aucune fiche trouvée</p>
      </div>

      <div v-else class="table-container">
        <table class="fiches-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Classe</th>
              <th>Établissement</th>
              <th>Fichier source</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fiche in fiches" :key="fiche.id">
              <td>{{ fiche.id }}</td>
              <td><strong>{{ fiche.nom || '-' }}</strong></td>
              <td>{{ fiche.prenom || '-' }}</td>
              <td>{{ fiche.classe || '-' }}</td>
              <td>{{ fiche.etablissement_nom || '-' }}</td>
              <td>
                <span class="filename" :title="fiche.source_filename">
                  {{ truncateFilename(fiche.source_filename) }}
                </span>
              </td>
              <td>{{ formatDate(fiche.created_at) }}</td>
              <td>
                <span class="status-badge" :class="`status-${fiche.status}`">
                  {{ getStatusLabel(fiche.status) }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button
                    class="btn-icon"
                    title="Voir les détails"
                    @click="viewDetails(fiche.id)"
                  >
                    👁️
                  </button>
                  <button
                    v-if="(fiche.status === 'validated' || fiche.status === 'completed') && !fiche.pdf_output_path"
                    class="btn-icon btn-success"
                    title="Générer le PDF"
                    @click="generatePDF(fiche.id)"
                  >
                    📄
                  </button>
                  <a
                    v-if="fiche.pdf_output_path"
                    :href="`/api/fiches/${fiche.id}/pdf?token=${token}&download=true`"
                    class="btn-icon btn-primary"
                    title="Télécharger le PDF"
                    target="_blank"
                  >
                    ⬇️
                  </a>
                  <button
                    v-if="fiche.status === 'validated' || fiche.status === 'completed'"
                    class="btn-icon btn-edit"
                    title="Rééditer"
                    @click="emit('edit', fiche.id)"
                  >
                    ✏️
                  </button>
                  <button
                    class="btn-icon btn-danger"
                    title="Supprimer"
                    @click="deleteFiche(fiche.id)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="pagination.page === 1"
          @click="goToPage(pagination.page - 1)"
        >
          ← Précédent
        </button>
        <span class="pagination-info">
          Page {{ pagination.page }} sur {{ pagination.totalPages }}
          ({{ pagination.total }} fiches)
        </span>
        <button
          class="pagination-btn"
          :disabled="pagination.page === pagination.totalPages"
          @click="goToPage(pagination.page + 1)"
        >
          Suivant →
        </button>
      </div>
    </div>

    <!-- Modal de détails -->
    <div v-if="selectedFiche" class="modal-overlay" @click="closeDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Détails de la fiche #{{ selectedFiche.id }}</h3>
          <button class="close-btn" @click="closeDetails">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h4>👤 Élève</h4>
            <p><strong>Nom:</strong> {{ selectedFiche.nom }}</p>
            <p><strong>Prénom:</strong> {{ selectedFiche.prenom }}</p>
            <p><strong>Date de naissance:</strong> {{ selectedFiche.date_naissance || '-' }}</p>
            <p><strong>Classe:</strong> {{ selectedFiche.classe || '-' }}</p>
          </div>

          <div class="detail-section">
            <h4>🏫 Établissement</h4>
            <p><strong>Nom:</strong> {{ selectedFiche.etablissement_nom || '-' }}</p>
            <p><strong>Adresse:</strong> {{ selectedFiche.etablissement_adresse || '-' }}</p>
            <p><strong>Email:</strong> {{ selectedFiche.etablissement_email || '-' }}</p>
            <p><strong>Téléphone:</strong> {{ selectedFiche.etablissement_tel || '-' }}</p>
          </div>

          <div class="detail-section">
            <h4>📝 Saisine</h4>
            <p><strong>Origine:</strong> {{ selectedFiche.origine_saisine || '-' }}</p>
            <p><strong>Nom:</strong> {{ selectedFiche.origine_nom || '-' }}</p>
            <p><strong>Date demande:</strong> {{ selectedFiche.date_demande || '-' }}</p>
          </div>

          <div class="detail-section" v-if="selectedFiche.demandes && selectedFiche.demandes.length > 0">
            <h4>📋 Demandes</h4>
            <ul>
              <li v-for="demande in selectedFiche.demandes" :key="demande">
                {{ getDemandeLabel(demande) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const emit = defineEmits(['edit'])

const token = computed(() => localStorage.getItem('token'))

const fiches = ref([])
const loading = ref(true)
const error = ref(null)
const pagination = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const selectedFiche = ref(null)

let searchTimeout = null

onMounted(() => {
  loadFiches()
})

async function loadFiches(page = 1) {
  loading.value = true
  error.value = null

  try {
    const params = {
      page,
      limit: 20
    }

    if (statusFilter.value) {
      params.status = statusFilter.value
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const result = await api.getFiches(params)

    if (result.success) {
      fiches.value = result.fiches
      pagination.value = result.pagination
    } else {
      error.value = result.error || 'Erreur lors du chargement'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // Debounce la recherche
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadFiches(1)
  }, 500)
}

function goToPage(page) {
  loadFiches(page)
}

async function viewDetails(ficheId) {
  try {
    const result = await api.getFiche(ficheId)
    if (result.success) {
      selectedFiche.value = result.fiche
    }
  } catch (err) {
    alert('Erreur lors du chargement des détails')
  }
}

function closeDetails() {
  selectedFiche.value = null
}

async function deleteFiche(ficheId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette fiche ?')) {
    return
  }

  try {
    const result = await api.deleteFiche(ficheId)
    if (result.success) {
      loadFiches(pagination.value?.page || 1)
    } else {
      alert('Erreur lors de la suppression')
    }
  } catch (err) {
    alert('Erreur lors de la suppression')
  }
}

async function generatePDF(ficheId) {
  if (!confirm('Générer le PDF de retour de saisine pour cette fiche ?')) {
    return
  }

  try {
    loading.value = true
    const result = await api.generatePDF(ficheId)

    if (result.success) {
      alert('PDF généré avec succès ! Vous pouvez maintenant le télécharger.')
      loadFiches(pagination.value?.page || 1)
    } else {
      alert('Erreur : ' + (result.error || 'Impossible de générer le PDF'))
    }
  } catch (err) {
    alert('Erreur : ' + (err.response?.data?.error || 'Impossible de générer le PDF'))
  } finally {
    loading.value = false
  }
}

async function purgeAll() {
  if (!confirm('⚠️ ATTENTION ! Voulez-vous vraiment supprimer TOUTES les fiches de l\'historique ? Cette action est irréversible !')) {
    return
  }

  // Double confirmation
  if (!confirm('Dernière confirmation : Êtes-vous vraiment sûr de vouloir tout supprimer ?')) {
    return
  }

  try {
    loading.value = true
    const result = await api.deleteAllFiches()

    if (result.success) {
      alert(`✅ ${result.deleted} fiche(s) supprimée(s) avec succès !`)
      loadFiches(1)
    } else {
      alert('Erreur : ' + (result.error || 'Impossible de purger l\'historique'))
    }
  } catch (err) {
    alert('Erreur : ' + (err.response?.data?.error || 'Impossible de purger l\'historique'))
  } finally {
    loading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncateFilename(filename, maxLength = 30) {
  if (!filename) return '-'
  if (filename.length <= maxLength) return filename
  return filename.substring(0, maxLength - 3) + '...'
}

function getStatusLabel(status) {
  const labels = {
    pending: 'En attente',
    validated: 'Validé',
    completed: 'Terminé',
    error: 'Erreur'
  }
  return labels[status] || status
}

function getDemandeLabel(code) {
  const labels = {
    TSA: 'Trouble du Spectre Autistique',
    TROUBLE_COMPORTEMENT: 'Troubles du comportement',
    AESH: 'Accompagnement AESH',
    TDL: 'Trouble du Développement du Langage',
    TROUBLE_NEURODEV: 'Troubles neurodéveloppementaux',
    AMENAGEMENT_ESPACE: 'Aménagement de l\'espace classe',
    GESTES_PROFESSIONNELS: 'Gestes professionnels',
    PEDAGOGIE: 'Pédagogie auprès des élèves'
  }
  return labels[code] || code
}
</script>

<style scoped>
.fiches-list {
  max-width: 1400px;
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

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header h2 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.btn-purge {
  padding: 0.6rem 1.2rem;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-purge:hover:not(:disabled) {
  background: #cc0000;
  transform: translateY(-2px);
}

.btn-purge:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filters {
  display: flex;
  gap: 1rem;
}

.search-input,
.status-filter {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-input {
  width: 250px;
}

.search-input:focus,
.status-filter:focus {
  outline: none;
  border-color: #667eea;
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

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.table-container {
  overflow-x: auto;
}

.fiches-table {
  width: 100%;
  border-collapse: collapse;
}

.fiches-table th,
.fiches-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.fiches-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.fiches-table tbody tr:hover {
  background: #f8f9ff;
}

.filename {
  font-family: monospace;
  font-size: 0.85rem;
  color: #666;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-validated {
  background: #d1ecf1;
  color: #0c5460;
}

.status-completed {
  background: #d4edda;
  color: #155724;
}

.status-error {
  background: #f8d7da;
  color: #721c24;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: transform 0.2s;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.btn-edit {
  color: #ff9800;
}

.btn-edit:hover {
  background: #fff3e0;
  transform: scale(1.3);
}

.btn-danger:hover {
  filter: brightness(0.8);
}

.btn-success {
  color: #28a745;
}

.btn-success:hover {
  background: #e6f7ea;
  transform: scale(1.3);
}

.btn-primary {
  color: #667eea;
  text-decoration: none;
}

.btn-primary:hover {
  background: #e8efff;
  transform: scale(1.3);
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 2px solid #f0f0f0;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-info {
  color: #666;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 1.3rem;
  color: #333;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section h4 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: #667eea;
}

.detail-section p {
  margin-bottom: 0.5rem;
  color: #666;
}

.detail-section ul {
  list-style: none;
  padding: 0;
}

.detail-section li {
  padding: 0.5rem;
  background: #f8f9fa;
  margin-bottom: 0.5rem;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    flex-direction: column;
    width: 100%;
  }

  .search-input {
    width: 100%;
  }
}
</style>
