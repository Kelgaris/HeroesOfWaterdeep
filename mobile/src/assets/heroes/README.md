# Sprites de Héroes - Heroes of Waterdeep

## Descargar Sprites de FFBE

Los sprites están disponibles en: https://www.spriters-resource.com/mobile/finalfantasybraveexvius/

### Personajes Recomendados

| Personaje        | Uso en el juego                 | URL de descarga                                                                                |
| ---------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| Summoner Yuna    | Heroína del inicio (clickeable) | [asset/174350](https://www.spriters-resource.com/mobile/finalfantasybraveexvius/asset/174350/) |
| Aldore King Rain | Héroe inicial "Durnan"          | [asset/117472](https://www.spriters-resource.com/mobile/finalfantasybraveexvius/asset/117472/) |
| Rain básico      | Alternativa más simple          | [asset/241772](https://www.spriters-resource.com/mobile/finalfantasybraveexvius/asset/241772/) |

## Instrucciones de Instalación

1. **Descarga el ZIP** del personaje desde spriters-resource
2. **Extrae los archivos** PNG del ZIP
3. **Identifica las animaciones**:
   - `stand.png` o `idle.png` - Animación de reposo
   - `attack.png` - Ataque básico
   - `magic.png` o `limit.png` - Habilidades especiales
   - `win.png` o `victory.png` - Victoria
   - `dead.png` - Muerte

4. **Coloca los archivos** en las carpetas correspondientes:

   ```
   src/assets/heroes/
   ├── yuna/
   │   ├── stand.png
   │   ├── magic.png
   │   └── win.png
   └── rain/
       ├── stand.png
       ├── attack.png
       ├── limit.png
       └── win.png
   ```

5. **Actualiza la configuración** en `src/config/heroSprites.js`:
   - Descomenta las líneas de `require()`
   - Ajusta `frameWidth`, `frameHeight` según el sprite
   - Ajusta `frameCount` contando los frames del sprite sheet
   - Ajusta `columns` (normalmente igual a frameCount si es una fila)

## Cómo Identificar las Dimensiones del Sprite

1. Abre el sprite sheet en un editor de imágenes
2. Mide el ancho total de la imagen
3. Cuenta cuántos frames hay en horizontal
4. `frameWidth = ancho_total / número_de_frames`
5. `frameHeight` = alto de la imagen (si es una sola fila)

### Ejemplo con Summoner Yuna

Si el sprite de "stand" tiene:

- Ancho total: 1608px
- 12 frames en horizontal
- Alto: 140px

La configuración sería:

```javascript
idle: {
  source: require("../assets/heroes/yuna/stand.png"),
  frameWidth: 134,  // 1608 / 12
  frameHeight: 140,
  frameCount: 12,
  fps: 8,
  columns: 12,
}
```

## Uso en el Código

```javascript
import CharacterSprite from "../components/CharacterSprite";
import { HERO_SPRITES } from "../config/heroSprites";

// En tu componente:
<CharacterSprite
  animations={HERO_SPRITES.yuna.animations}
  currentAnimation="idle"
  scale={2}
/>;
```

## Notas Importantes

- Los sprites de FFBE son propiedad de Square Enix
- Solo para uso personal/educativo
- Algunos sprites tienen múltiples filas - ajusta `columns` apropiadamente
