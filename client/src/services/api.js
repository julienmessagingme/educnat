import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs (dont 401)
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userEmail')
      window.location.reload()
    }
    console.error('Erreur API:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default {
  // Auth
  async login(email, password) {
    const response = await api.post('/login', { email, password })
    return response.data
  },

  async logout() {
    try { await api.post('/logout') } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
  },

  // Upload fichier
  async uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  },

  // Récupérer une fiche
  async getFiche(id) {
    const response = await api.get(`/fiches/${id}`)
    return response.data
  },

  // Valider et mettre à jour une fiche
  async validateFiche(id, data) {
    const response = await api.put(`/fiches/${id}/validate`, data)
    return response.data
  },

  // Liste des fiches
  async getFiches(params = {}) {
    const response = await api.get('/fiches', { params })
    return response.data
  },

  // Supprimer une fiche
  async deleteFiche(id) {
    const response = await api.delete(`/fiches/${id}`)
    return response.data
  },

  // Supprimer toutes les fiches
  async deleteAllFiches() {
    const response = await api.delete('/fiches')
    return response.data
  },

  // Types de demandes
  async getTypesDemande() {
    const response = await api.get('/fiches/reference/types-demande')
    return response.data
  },

  // Génération PDF
  async generatePDF(id) {
    const response = await api.post(`/fiches/${id}/generate-pdf`)
    return response.data
  },

  // Télécharger PDF
  getPDFUrl(id) {
    return `/api/fiches/${id}/pdf`
  },

  // Propositions
  async saveProposition(data) {
    const response = await api.post('/propositions', data)
    return response.data
  },

  async getProposition(ficheId, temps) {
    const response = await api.get(`/propositions/${ficheId}/${temps}`)
    return response.data
  },

  async getMotifsPrincipaux() {
    const response = await api.get('/propositions/reference/motifs-principaux')
    return response.data
  }
}
