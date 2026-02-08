<template>
  <div class="pdf-preview">
    <div class="card">
      <div class="header">
        <h2>✅ PDF généré avec succès !</h2>
        <p>Voici un aperçu de votre document</p>
      </div>

      <div class="preview-container">
        <iframe
          :src="pdfUrl"
          class="pdf-iframe"
          frameborder="0"
        ></iframe>
      </div>

      <div class="actions">
        <button
          class="btn-back"
          @click="handleBack"
        >
          ← Revenir en arrière
        </button>
        <a
          :href="pdfUrl + '?download=true'"
          class="btn-primary"
          target="_blank"
        >
          ⬇️ Télécharger le PDF
        </a>
        <button
          class="btn-secondary"
          @click="handleFinish"
        >
          ✅ Terminer et voir l'historique
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  ficheId: {
    type: Number,
    required: true
  },
  pdfUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['finish', 'back'])

function handleFinish() {
  emit('finish')
}

function handleBack() {
  emit('back')
}
</script>

<style scoped>
.pdf-preview {
  max-width: 1200px;
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
  text-align: center;
}

.header h2 {
  font-size: 1.8rem;
  color: #28a745;
  margin-bottom: 0.5rem;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.preview-container {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
}

.pdf-iframe {
  width: 100%;
  height: 800px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #f0f0f0;
}

.btn-primary,
.btn-secondary,
.btn-back {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
  }

  .pdf-iframe {
    height: 600px;
  }
}
</style>
