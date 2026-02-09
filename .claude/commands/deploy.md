# Deploy - Mise à jour du projet sur le VPS

Déploie les changements sur le VPS de production.

## Infos serveur
- VPS IP : 146.59.233.252
- User SSH : ubuntu
- Chemin projet : /home/ubuntu/educnat/
- Conteneur Docker : educnat-app
- Site : https://educnat.messagingme.app
- Port : 3005
- Nginx Proxy Manager avec SSL
- GitHub : https://github.com/julienmessagingme/educnat

## Étapes à exécuter

1. **Git commit & push** : Commiter tous les fichiers modifiés avec un message descriptif, puis pousser sur GitHub
2. **Déployer sur le VPS** via SSH :
   ```bash
   ssh ubuntu@146.59.233.252 "cd /home/ubuntu/educnat && git pull && docker compose up -d --build"
   ```
3. **Vérifier** que le site répond :
   ```bash
   curl -s -o /dev/null -w "%{http_code}" https://educnat.messagingme.app/health
   ```

## Instructions
- Toujours commiter et pousser AVANT de déployer
- Après le deploy, vérifier que https://educnat.messagingme.app répond
- Pour voir les logs : `ssh ubuntu@146.59.233.252 "docker logs educnat-app --tail 50"`
