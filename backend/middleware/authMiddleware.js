
const jwt = require('jsonwebtoken');

const extractToken = (authorizationHeader) => {
    if (!authorizationHeader) {
        return null;
    }

    if (authorizationHeader.startsWith('Bearer ')) {
        return authorizationHeader.slice(7).trim();
    }

    return authorizationHeader.trim();
};

// Middleware para verificar el token JWT en las solicitudes protegidas
module.exports = (req, res, next) => {

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Configuración del servidor incompleta (JWT_SECRET faltante).' });
    }

    // El token JWT se espera que se envíe en el encabezado de autorización de la solicitud
    const token = extractToken(req.headers.authorization);

    if(!token){
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
    }

    try{
        // Verificamos el token utilizando la clave secreta definida en las variables de entorno
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Si el token es válido, almacenamos el ID del usuario en la solicitud para su uso posterior
        req.usuarioId = decoded.id;
        // Continuamos con la siguiente función de middleware o ruta
        next();
    }catch(error){
        console.error('Error en la verificación del token:', error);
        res.status(400).json({ message: 'Token inválido.' });
    }
};