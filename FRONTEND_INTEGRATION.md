# 📡 Guía de Integración - Chat Service API

## 🌐 Información del Servicio

- **URL Desarrollo**: `http://localhost:3001`
- **URL Producción**: `https://meeting5-chat.onrender.com` (configurar según deployment)
- **Protocolo**: WebSocket (Socket.IO)
- **Autenticación**: JWT Bearer Token

---

## 🔌 Conexión WebSocket

### URL de Conexión
```
ws://localhost:3001
```

### Autenticación Requerida
Al conectar, debes incluir el JWT token en el handshake:

```javascript
{
  auth: {
    token: "TU_JWT_TOKEN_AQUI"
  }
}
```

El token debe ser el mismo que obtienes del backend principal al hacer login en:
```
POST http://localhost:3000/api/users/login
```

---

## 📤 Eventos que Envías (Cliente → Servidor)

### 1. `join-room` - Unirse a una sala de reunión

**Cuándo usar**: Después de conectarte exitosamente, para unirte a la sala de chat de una reunión específica.

**Payload**:
```json
{
  "meetingId": "string (UUID del meeting)",
  "token": "string (JWT token del usuario)"
}
```

**Ejemplo**:
```json
{
  "meetingId": "Yqry6zKtEfYcrIkg8ptw",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2. `send-message` - Enviar un mensaje

**Cuándo usar**: Cuando el usuario escribe y envía un mensaje en el chat.

**Payload**:
```json
{
  "content": "string (texto del mensaje, no puede estar vacío)"
}
```

**Ejemplo**:
```json
{
  "content": "Hola a todos!"
}
```

---

### 3. `leave-room` - Salir de la sala

**Cuándo usar**: Cuando el usuario abandona la reunión o cierra el chat.

**Payload**: Ninguno (evento sin datos)

---

## 📥 Eventos que Recibes (Servidor → Cliente)

### 1. `connect` - Conexión establecida

**Cuándo se recibe**: Inmediatamente después de conectar exitosamente al servicio.

**Datos**: Ninguno

**Qué hacer**: Emitir `join-room` para unirte a la sala del meeting.

---

### 2. `room-joined` - Confirmación de unión a sala

**Cuándo se recibe**: Después de emitir `join-room` exitosamente.

**Estructura de datos**:
```json
{
  "meetingId": "string",
  "meetingTitle": "string",
  "participants": [
    {
      "id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string"
    }
  ],
  "message": "string"
}
```

**Ejemplo**:
```json
{
  "meetingId": "Yqry6zKtEfYcrIkg8ptw",
  "meetingTitle": "Test Meeting Chat",
  "participants": [
    {
      "id": "juzmBVMYhtudeiJK4pwp",
      "firstName": "Juan",
      "lastName": "Rodas",
      "email": "rodas.ramirez.juan@correounivalle.edu.co"
    }
  ],
  "message": "Successfully joined Test Meeting Chat"
}
```

---

### 3. `new-message` - Nuevo mensaje recibido

**Cuándo se recibe**: Cuando alguien (incluyéndote) envía un mensaje en la sala.

**Estructura de datos**:
```json
{
  "id": "string (UUID único del mensaje)",
  "meetingId": "string",
  "userId": "string (ID del usuario que envió)",
  "userName": "string (Nombre completo del usuario)",
  "content": "string (contenido del mensaje)",
  "timestamp": "Date (fecha/hora del mensaje)"
}
```

**Ejemplo**:
```json
{
  "id": "9ab54814-51db-4c47-9fb4-bf6ba64df659",
  "meetingId": "Yqry6zKtEfYcrIkg8ptw",
  "userId": "juzmBVMYhtudeiJK4pwp",
  "userName": "Juan Rodas",
  "content": "Hola a todos!",
  "timestamp": "2025-11-23T18:46:21.000Z"
}
```

---

### 4. `user-joined` - Usuario se unió al chat

**Cuándo se recibe**: Cuando otro usuario se une a la misma sala.

**Estructura de datos**:
```json
{
  "userId": "string",
  "userName": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Ejemplo**:
```json
{
  "userId": "abc123xyz",
  "userName": "María González",
  "timestamp": "2025-11-23T18:50:00.000Z"
}
```

---

### 5. `user-left` - Usuario salió del chat

**Cuándo se recibe**: Cuando otro usuario sale de la sala.

**Estructura de datos**:
```json
{
  "userId": "string",
  "userName": "string",
  "timestamp": "string (ISO 8601)"
}
```

**Ejemplo**:
```json
{
  "userId": "abc123xyz",
  "userName": "María González",
  "timestamp": "2025-11-23T18:55:00.000Z"
}
```

---

### 6. `error` - Error del servidor

**Cuándo se recibe**: Cuando ocurre un error (ejemplo: no tienes acceso al meeting, mensaje vacío, etc.)

**Estructura de datos**:
```json
{
  "message": "string (descripción del error)"
}
```

**Ejemplos de errores**:
```json
{ "message": "Access denied to this meeting" }
{ "message": "Not in a meeting room" }
{ "message": "Message content cannot be empty" }
{ "message": "User not authenticated" }
```

---

### 7. `connect_error` - Error de conexión

**Cuándo se recibe**: Cuando falla la conexión inicial (token inválido, servicio caído, etc.)

**Estructura de datos**:
```javascript
Error {
  message: "string"
}
```

**Ejemplos**:
```
"Authentication error - token required"
"Authentication error - invalid token"
```

---

### 8. `disconnect` - Desconexión

**Cuándo se recibe**: Cuando pierdes la conexión con el servidor.

**Datos**: 
```javascript
reason: string
```

**Razones comunes**:
- `"io server disconnect"` - El servidor te desconectó (debes reconectar manualmente)
- `"io client disconnect"` - Tú desconectaste (llamaste a disconnect)
- `"ping timeout"` - Se perdió la conexión (se reconecta automáticamente)
- `"transport close"` - Problema de red (se reconecta automáticamente)

---

## 🔐 Autenticación y Autorización

### Flujo Completo

1. **Usuario hace login** en el backend principal
   ```
   POST http://localhost:3000/api/users/login
   Body: { email, password }
   Respuesta: { token }
   ```

2. **Conectar al Chat Service** con el token
   ```javascript
   socket.connect({ auth: { token } })
   ```

3. **Chat Service valida el token** llamando a:
   ```
   GET http://localhost:3000/api/users/verify-token
   Headers: { Authorization: "Bearer TOKEN" }
   ```

4. **Unirse a una sala** enviando `join-room`
   - El servicio verifica que tengas acceso al meeting llamando a:
   ```
   GET http://localhost:3000/api/meetings/{meetingId}/participants
   Headers: { Authorization: "Bearer TOKEN" }
   ```

5. **Si todo es válido**, recibes `room-joined` y ya puedes chatear

---

## 🚨 Manejo de Errores

### Errores que Debes Manejar

| Caso | Evento | Acción Recomendada |
|------|--------|-------------------|
| Token inválido/expirado | `connect_error` | Hacer logout y pedir re-login |
| Sin acceso al meeting | `error` con "Access denied" | Redirigir al dashboard |
| No estás en una sala | `error` con "Not in a meeting room" | Volver a hacer `join-room` |
| Mensaje vacío | `error` con "cannot be empty" | Validar input antes de enviar |
| Conexión perdida | `disconnect` | Intentar reconectar automáticamente |

---

## 🔄 Reconexión Automática

Socket.IO maneja reconexiones automáticamente en la mayoría de casos, pero debes:

1. **Volver a unirte a la sala** después de reconectar:
   ```javascript
   socket.on('connect', () => {
     socket.emit('join-room', { meetingId, token });
   });
   ```

2. **Informar al usuario** cuando está desconectado temporalmente

---

## 📊 Características Importantes

### Aislamiento de Mensajes
- Los mensajes **solo se envían a usuarios en la misma sala** (mismo meetingId)
- Usuarios en diferentes meetings **no ven los mensajes de otros**

### IDs Únicos
- Cada mensaje tiene un **UUID único** en el campo `id`
- Puedes usar esto como `key` en listas de React, por ejemplo

### Timestamps
- Los timestamps vienen en formato **ISO 8601** (UTC)
- Debes convertirlos a la zona horaria local en el frontend

### Sin Persistencia
- Los mensajes **NO se guardan** en base de datos (Sprint 2)
- Solo chat en tiempo real
- Si recargas la página, pierdes el historial

---

## 🧪 Testing en Desarrollo

### Health Check del Servicio
```
GET http://localhost:3001/health

Respuesta:
{
  "success": true,
  "message": "Chat service running",
  "timestamp": "2025-11-23T18:00:00.000Z"
}
```

### Información del Servicio
```
GET http://localhost:3001/

Respuesta:
{
  "success": true,
  "service": "Meeting5 Chat Microservice",
  "version": "1.0.0",
  "websocket": "Socket.IO v4",
  "endpoints": {
    "health": "/health"
  }
}
```

---

## 🌍 Variables de Entorno

### Desarrollo
```
CHAT_SERVICE_URL=http://localhost:3001
```

### Producción
```
CHAT_SERVICE_URL=https://meeting5-chat.onrender.com
```

---

## 💡 Recomendaciones

1. **Conecta solo cuando el usuario esté en una reunión activa** (no al cargar la app)
2. **Desconecta cuando el usuario salga del meeting** para liberar recursos
3. **Muestra un indicador visual** del estado de conexión (conectado/desconectado)
4. **Valida los mensajes** en el frontend antes de enviarlos (no vacíos, longitud máxima)
5. **Maneja los errores de forma amigable** (toasts, alertas, etc.)
6. **Implementa auto-scroll** al último mensaje cuando lleguen mensajes nuevos
7. **Usa los eventos `user-joined/left`** para mostrar notificaciones opcionales

---

## 📚 Documentación Adicional

- Socket.IO Client API: https://socket.io/docs/v4/client-api/
- Especificaciones del Backend: Ver repositorio `meeting5-backend`
- Repositorio del Chat Service: https://github.com/JuanSebastianRodasRamirez/meeting5-CHAT

---

**¿Dudas o problemas? Contacta al equipo de backend 🚀**
