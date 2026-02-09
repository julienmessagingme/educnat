# Deploy - Mise à jour du projet sur le VPS

Déploie les changements sur le VPS de production.

## Infos serveur
- VPS IP : 146.59.233.252
- User SSH : ubuntu
- Chemin projet : /home/ubuntu/educnat/
- Conteneur Docker : educnat-app
- Site : https://educnat.messagingme.app
- Port : 3005 (variable PORT dans docker-compose.yml, Nginx Proxy Manager pointe vers 3005)
- Nginx Proxy Manager avec SSL
- GitHub : https://github.com/julienmessagingme/educnat

## Étapes à exécuter

1. **Git commit & push** : Commiter tous les fichiers modifiés avec un message descriptif, puis pousser sur GitHub

2. **Déployer sur le VPS** via SSH (commande complète) :
   ```bash
   ssh ubuntu@146.59.233.252 "sudo chown -R ubuntu:ubuntu /home/ubuntu/educnat && cd /home/ubuntu/educnat && git pull && sudo docker ps -a --filter name=educnat -q | xargs -r sudo docker rm -f && sudo docker-compose up -d --force-recreate --no-deps --build"
   ```

3. **Vérifier** que le site répond (depuis le VPS, car curl local peut échouer avec SSL) :
   ```bash
   ssh ubuntu@146.59.233.252 "curl -s -o /dev/null -w '%{http_code}' http://localhost:3005/health"
   ```
   Doit retourner `200`.

4. **Si problème**, vérifier les logs :
   ```bash
   ssh ubuntu@146.59.233.252 "sudo docker logs educnat-app --tail 50"
   ```

## Pièges connus (leçons apprises)

- **`docker-compose` avec tiret** : le VPS a docker-compose 1.29.2 (Python), PAS `docker compose` (plugin Go). Toujours utiliser `docker-compose` avec un tiret.
- **`sudo` obligatoire** pour toutes les commandes docker sur le VPS.
- **Permissions git** : `git pull` échoue avec "Permission denied" si les fichiers appartiennent à root (après un docker build). Toujours faire `sudo chown -R ubuntu:ubuntu /home/ubuntu/educnat` AVANT `git pull`.
- **Conflit de conteneur** : l'ancien conteneur `educnat-app` bloque la recréation. Toujours supprimer les conteneurs existants AVANT de relancer (`docker rm -f`).
- **Bug ContainerConfig** : docker-compose 1.29.2 a un bug connu lors du recreate. Utiliser `--force-recreate --no-deps` après avoir supprimé les anciens conteneurs.
- **Port 3005** : le docker-compose.yml doit avoir `PORT=3005`. Nginx Proxy Manager redirige vers ce port. Si le port est mauvais → erreur 502 sur le site.
- **Health check local** : le `curl` depuis Windows vers `https://educnat.messagingme.app/health` peut échouer (SSL). Préférer vérifier depuis le VPS via `http://localhost:3005/health`.

## Instructions
- Toujours commiter et pousser AVANT de déployer
- Après le deploy, vérifier que le health check retourne 200
- Ne JAMAIS changer le PORT dans docker-compose.yml (doit rester 3005)
