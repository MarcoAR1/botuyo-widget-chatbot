# 🚨 Resolución de Error de Push - GitHub 403

## Problema

Al intentar hacer push al repositorio `paseo-widget-chatbot`, obtuviste:

```
error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403
```

---

## Causas Comunes

1. **Autenticación HTTPS**: Necesitas Personal Access Token (PAT)
2. **Permisos del repositorio**: No tienes permisos de write
3. **Token expirado**: El token de GitHub expiró

---

## ✅ Solución Recomendada: Usar SSH

### Paso 1: Verificar si tienes SSH key

```bash
ls -la ~/.ssh
```

Si ves `id_rsa.pub` o `id_ed25519.pub`, ya tienes una SSH key. Salta al Paso 3.

### Paso 2: Crear SSH Key (si no tienes)

```bash
# Generar nueva SSH key
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# Press Enter 3 veces (usa defaults)
```

### Paso 3: Copiar tu SSH Public Key

```bash
# Mostrar tu public key
cat ~/.ssh/id_ed25519.pub

# O si es RSA:
cat ~/.ssh/id_rsa.pub
```

Copia todo el output (empieza con `ssh-ed25519` o `ssh-rsa`).

### Paso 4: Agregar SSH Key a GitHub

1. Ir a [GitHub → Settings → SSH and GPG keys](https://github.com/settings/keys)
2. Click "New SSH key"
3. Title: "Mi Mac" (o lo que quieras)
4. Key: Pegar tu public key
5. Click "Add SSH key"

### Paso 5: Cambiar Remote a SSH

```bash
cd ~/Documents/paseo-widget-chatbot

# Ver remote actual
git remote -v

# Cambiar a SSH
git remote set-url origin git@github.com:MarcoAR1/paseo-widget-chatbot.git

# Verificar
git remote -v
```

### Paso 6: Push Again

```bash
git push -u origin main
```

Debería funcionar sin pedir contraseña.

---

## 🔐 Alternativa: Usar Personal Access Token (PAT)

Si prefieres seguir con HTTPS:

### Paso 1: Crear Personal Access Token

1. Ir a [GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Note: "Paseo Widget Chatbot"
4. Expiration: 90 days (o lo que prefieras)
5. Scopes:
   - ✅ **repo** (todos los checkboxes debajo)
   - ✅ **workflow**
6. Click "Generate token"
7. **COPIAR EL TOKEN** (solo se muestra una vez!)

### Paso 2: Configurar Git Credential

**Opción A: macOS Keychain (recomendado)**

```bash
# Configurar git para usar keychain
git config --global credential.helper osxkeychain

# Push con token
cd ~/Documents/paseo-widget-chatbot
git push -u origin main

# Username: MarcoAR1
# Password: [PEGAR TU TOKEN AQUÍ]
```

macOS guardará el token en el Keychain.

**Opción B: Credential Manager**

```bash
# Guardar token en credential manager
git config --global credential.helper store

# Push
git push -u origin main

# Username: MarcoAR1
# Password: [PEGAR TU TOKEN]
```

---

## 🔍 Verificar Permisos del Repositorio

Si ninguna de las anteriores funciona:

1. Ir a [https://github.com/MarcoAR1/paseo-widget-chatbot/settings](https://github.com/MarcoAR1/paseo-widget-chatbot/settings)
2. Verificar que tienes "Admin" o "Write" access
3. Si no aparece "Settings", no eres owner → pide acceso al owner

---

## 📋 Checklist de Resolución

- [ ] SSH key generada
- [ ] SSH key agregada a GitHub
- [ ] Remote cambiado a SSH (`git@github.com:...`)
- [ ] Push exitoso con SSH

O si usas HTTPS:
- [ ] Personal Access Token generado
- [ ] Token guardado en Keychain/Credential Manager
- [ ] Push exitoso con token

---

## 🎯 Comando Final

Una vez resuelto:

```bash
cd ~/Documents/paseo-widget-chatbot
git push -u origin main
```

Deberías ver:

```
Enumerating objects: 51, done.
Counting objects: 100% (51/51), done.
Writing objects: 100% (51/51), 66.81 KiB | 1.08 MiB/s, done.
Total 51 (delta 0), reused 0 (delta 0)
To github.com:MarcoAR1/paseo-widget-chatbot.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

✅ **¡Listo!**

---

## 🔄 Siguiente Paso: Configurar GitHub Actions

Después del push exitoso:

1. Ir a [https://github.com/MarcoAR1/paseo-widget-chatbot/settings/secrets/actions](https://github.com/MarcoAR1/paseo-widget-chatbot/settings/secrets/actions)
2. Agregar secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
3. Ir a Actions → Deploy to Cloudflare R2 → Run workflow

Ver [CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md) para más detalles.

---

**Última actualización**: 21 enero 2026
