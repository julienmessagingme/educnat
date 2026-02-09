<template>
  <div class="analyses-list">
    <div class="card">
      <div class="header">
        <h2>📚 Historique des analyses</h2>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div v-else-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <div v-else-if="analyses.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Aucune analyse trouvée</p>
      </div>

      <div v-else class="table-container">
        <table class="analyses-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="analyse in analyses" :key="analyse.id">
              <td>{{ analyse.id }}</td>
              <td><strong>{{ analyse.nom_enfant || '-' }}</strong></td>
              <td>{{ analyse.prenom_enfant || '-' }}</td>
              <td>{{ formatDate(analyse.created_at) }}</td>
              <td>
                <span class="status-badge" :class="`status-${analyse.status}`">
                  {{ getStatusLabel(analyse.status) }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <a
                    v-if="analyse.pdf_output_path"
                    :href="getPdfLink(analyse.id)"
                    class="btn-icon btn-primary"
                    title="Télécharger le PDF"
                    target="_blank"
                  >
                    ⬇️
                  </a>
                  <button
                    class="btn-icon btn-danger"
                    title="Supprimer"
                    @click="deleteAnalyse(analyse.id)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pagination && pagination.totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="pagination.page === 1"
          @click="loadAnalyses(pagination.page - 1)"
        >
          ← Précédent
        </button>
        <span class="pagination-info">
          Page {{ pagination.page }} sur {{ pagination.totalPages }}
        </span>
        <button
          class="pagination-btn"
          :disabled="pagination.page === pagination.totalPages"
          @click="loadAnalyses(pagination.page + 1)"
        >
          Suivant →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const analyses = ref([])
const loading = ref(true)
const error = ref(null)
const pagination = ref(null)

onMounted(() => {
  loadAnalyses()
})

async function loadAnalyses(page = 1) {
  loading.value = true
  error.value = null

  try {
    const result = await api.getAnalyses({ page, limit: 20 })

    if (result.success) {
      analyses.value = result.analyses
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

async function deleteAnalyse(analyseId) {
  if (!confirm('Supprimer cette analyse ?')) return

  try {
    const result = await api.deleteAnalyse(analyseId)
    if (result.success) {
      loadAnalyses(pagination.value?.page || 1)
    }
  } catch (err) {
    alert('Erreur lors de la suppression')
  }
}

function getPdfLink(analyseId) {
  const token = localStorage.getItem('token')
  return `/api/analyses/${analyseId}/pdf?token=${token}`
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

function getStatusLabel(status) {
  const labels = {
    pending: 'En attente',
    validated: 'Validé',
    completed: 'Terminé',
    error: 'Erreur'
  }
  return labels[status] || status
}
</script>

<style scoped>
.analyses-list {
  max-width: 1000px;
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
  margin: 0;
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

.analyses-table {
  width: 100%;
  border-collapse: collapse;
}

.analyses-table th,
.analyses-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.analyses-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.analyses-table tbody tr:hover {
  background: #f8f9ff;
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
  text-decoration: none;
}

.btn-icon:hover {
  transform: scale(1.2);
}

.btn-danger:hover {
  filter: brightness(0.8);
}

.btn-primary {
  color: #667eea;
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
</style>
