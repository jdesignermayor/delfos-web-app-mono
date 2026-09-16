-- Seed data for developers table
INSERT INTO developers (name, phone, address) VALUES
('Constructora MRD', '+57 (4) 260-1234', 'Carrera 50 #10-20, Medellín'),
('Constructora Bolívar', '+57 (4) 312-5678', 'Calle 10 #45-30, Medellín'),
('Grupo Constructor Invesco', '+57 (4) 266-9012', 'Carrera 43a #5-67, Medellín'),
('Constructor Urbano', '+57 (4) 285-3456', 'Calle 49 #52-15, Medellín'),
('Desarrollos Empresariales', '+57 (4) 540-7890', 'Carrera 66 #20-10, Medellín'),
('Constructor Premium', '+57 (4) 294-2345', 'Calle 80 #60-25, Medellín'),
('Constructora Colombia Plus', '+57 (4) 310-1111', 'Carrera 30 #8-50, Medellín');

-- Seed data for banks table
INSERT INTO banks (name, nit, phone, email, address, description) VALUES
('Banco de Bogotá', '860000000-1', '+57 (1) 334-3333', 'credito@bancodebogota.com.co', 'Carrera 7 #50-60, Bogotá', 'Banco líder en financiamiento inmobiliario'),
('Bancolombia', '890900000-2', '+57 (4) 204-9999', 'hipotecas@bancolombia.com.co', 'Calle 50 #52-60, Medellín', 'Especialista en créditos hipotecarios'),
('BBVA Colombia', '880800001-3', '+57 (1) 595-0000', 'vivienda@bbva.com.co', 'Calle 72 #7-51, Bogotá', 'Soluciones de financiamiento para vivienda'),
('Banco Davivienda', '870010002-4', '+57 (1) 330-0000', 'hipotecas@davivienda.com.co', 'Carrera 9 #99-02, Bogotá', 'Tu banco de confianza para comprar vivienda'),
('Banco Pichincha', '900123456-5', '+57 (4) 320-1000', 'credito.vivienda@pichincha.com.co', 'Carrera 48 #30-90, Medellín', 'Créditos inmobiliarios a la mejor tasa'),
('Scotiabank Colpatria', '910234567-6', '+57 (1) 634-0000', 'vivienda@scotiabank.com.co', 'Calle 24 #57-30, Bogotá', 'Financiamiento rápido y seguro para tu hogar'),
('Banco Santander', '920345678-7', '+57 (1) 323-4444', 'hipoteca@santander.com.co', 'Carrera 15 #89-50, Bogotá', 'Expertos en préstamos para vivienda nueva');

-- Seed data for common_areas table
INSERT INTO common_areas (name, phone, email, address, description) VALUES
('Zona Verde Premium', '+57 (4) 360-1111', 'zonaverdepremium@proyectos.com', 'Parque Central del Proyecto', 'Espacio verde de 5.000 m² con canchas, juegos infantiles y áreas de esparcimiento'),
('Centro Comercial Interno', '+57 (4) 360-2222', 'centrocomercial@proyectos.com', 'Nivel 2 Edificio Principal', 'Mall interior con tiendas, cafeterías y servicios'),
('Piscina Olímpica', '+57 (4) 360-3333', 'piscina@proyectos.com', 'Área de Recreación Acuática', 'Piscina de 50m x 25m, piscina para niños y área de jacuzzi'),
('Gimnasio de Clase Mundial', '+57 (4) 360-4444', 'gimnasio@proyectos.com', 'Edificio de Bienestar', 'Equipamiento completo con máquinas cardiovasculares, pesas y salas de clases'),
('Salón de Eventos', '+57 (4) 360-5555', 'eventos@proyectos.com', 'Torre Social', 'Salón multiusos para conferencias, celebraciones y reuniones sociales'),
('Biblioteca Comunitaria', '+57 (4) 360-6666', 'biblioteca@proyectos.com', 'Edificio Cultural', 'Espacio de lectura, estudios y acceso a internet de alta velocidad'),
('Parque Infantil Seguro', '+57 (4) 360-7777', 'parqueinfantil@proyectos.com', 'Zona Verde Infantil', 'Área completamente vallada con juegos seguros y supervisados'),
('Cancha Polideportiva', '+57 (4) 360-8888', 'deportes@proyectos.com', 'Complejo Deportivo', 'Cancha múltiple para fútbol, baloncesto y voleibol'),
('Coworking y Oficinas Compartidas', '+57 (4) 360-9999', 'coworking@proyectos.com', 'Edificio de Negocios', 'Espacios de trabajo flexible con salas de reunión equipadas'),
('Ciclovía y Senderos Verdes', '+57 (4) 360-1010', 'ciclovias@proyectos.com', 'Circuito Recreativo', 'Vías seguras para ciclos y caminatas dentro del complejo');
