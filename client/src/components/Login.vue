<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Tableau de bord Cecile D.</h1>
      <p class="subtitle">Connectez-vous pour accéder à l'application</p>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="votre@email.fr"
            required
            autofocus
          />
        </div>

        <div class="form-group">
          <label>Mot de passe</label>
          <input
            v-model="password"
            type="password"
            placeholder="Mot de passe"
            required
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" class="btn-login" :disabled="loading">
          <span v-if="!loading">Se connecter</span>
          <span v-else>Connexion...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../services/api'

const emit = defineEmits(['logged-in'])

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const result = await api.login(email.value, password.value)
    if (result.success) {
      localStorage.setItem('token', result.token)
      localStorage.setItem('userEmail', result.email)
      emit('logged-in')
    } else {
      error.value = result.error || 'Erreur de connexion'
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Email ou mot de passe incorrect'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.login-card h1 {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #888;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;
}

.form-group label {
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  color: #e53e3e;
  font-size: 0.9rem;
  background: #fff5f5;
  padding: 0.6rem;
  border-radius: 6px;
  border: 1px solid #fcc;
}

.btn-login {
  padding: 0.85rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
