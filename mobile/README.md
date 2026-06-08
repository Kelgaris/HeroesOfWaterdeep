# Heroes of Waterdeep 🎮⚔️

Un juego RPG estilo Gacha desarrollado con React Native (Expo) y Node.js.

## Características

### Frontend (React Native/Expo)

- **Sistema de Autenticación**: Login y Registro con validación
- **Pantalla Home Estilo Gacha**:
  - Barra de recursos (Nivel, Energía, Oro, Gemas)
  - Sprite de héroe interactivo con diálogos
  - Menú de navegación (Héroes, Aventura, Invocar, Inventario)
- **Componentes Reutilizables**:
  - `FantasyButton`: Botones con estilo fantasía
  - `GameBackground`: Fondos de pantalla del juego
  - `ResourceBar`: Barra de recursos del usuario
  - `HeroSprite`: Sprite animado del héroe principal
  - `GameMenu`: Menú de navegación inferior
  - `HeroCard`: Tarjetas de visualización de héroes
  - `GeometricShape`: Formas geométricas para representar héroes/enemigos

### Backend (Node.js/Express)

- **Autenticación JWT**
- **Sistema de Gacha** con probabilidades:
  - 2% Legendario (5★)
  - 10% Épico (4★)
  - 30% Raro (3★)
  - 58% Común (2★)
- **Sistema de Batalla** por turnos
- **Modelos**:
  - Usuario (nivel, recursos, héroes, progreso)
  - Héroes (10 héroes base con stats)
  - Enemigos (12 enemigos con diferentes tipos)
  - Stages (8 niveles en 2 zonas)
- **Héroe Inicial**: Al registrarse, cada usuario recibe la "Guerrera de Waterdeep"

## Instalación

### Backend

```bash
cd backend
npm install
# Configurar .env con MONGO_URI y JWT_SECRET
npm start
```

### Frontend

```bash
cd HeroesOfWaterdeep
npm install
npx expo start
```

## Estructura del Proyecto

```
HeroesOfWaterdeep/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── app.js
└── HeroesOfWaterdeep/
    └── src/
        ├── components/
        ├── screens/
        ├── services/
        └── assets/
```

## API Endpoints

### Autenticación

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Héroes

- `GET /api/heroes` - Obtener todos los héroes
- `GET /api/heroes/user` - Obtener héroes del usuario

### Gacha

- `POST /api/gacha/summon` - Invocación simple
- `POST /api/gacha/summon-multi` - Invocación x10

### Batalla

- `GET /api/battle/stages` - Obtener stages disponibles
- `POST /api/battle/battle` - Iniciar batalla
- `POST /api/battle/refresh-energy` - Regenerar energía

## Tecnologías

- **Frontend**: React Native, Expo, React Navigation, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt
- **Estilo**: StyleSheet de React Native (sin dependencias CSS externas)
