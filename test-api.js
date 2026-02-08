require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testAPI() {
  console.log('🔑 Clé API:', process.env.ANTHROPIC_API_KEY ? 'Définie' : 'NON DÉFINIE');
  console.log('📝 Test d\'appel à l\'API Claude...\n');

  const modelsToTry = [
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229',
    'claude-3-5-sonnet-20240620',
    'claude-3-5-sonnet-20241022',
    'claude-2.1',
    'claude-2.0',
    'claude-instant-1.2'
  ];

  for (const model of modelsToTry) {
    try {
      console.log(`Testing ${model}...`);
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Réponds juste "OK"'
        }]
      });

      console.log(`✅ ${model} FONCTIONNE !`);
      console.log(`   Réponse: ${message.content[0].text}\n`);

      // Si on trouve un modèle qui marche, on s'arrête
      console.log(`\n🎉 MODÈLE TROUVÉ : ${model}`);
      break;

    } catch (error) {
      console.log(`❌ ${model} : ${error.message}\n`);
    }
  }
}

testAPI().catch(err => {
  console.error('Erreur globale:', err);
});
