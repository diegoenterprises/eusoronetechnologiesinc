-- 0026_cross_border_tables.sql
-- Phase 0+1: Cross-border foundation tables
-- Carta Porte, Pedimentos, Agente Aduanal, Mexican Insurance, Border Crossings, Exchange Rates

-- ─── Carta Porte Documents ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `carta_porte` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `document_id` varchar(64) NOT NULL UNIQUE,
  `version` varchar(8) NOT NULL DEFAULT '3.1',
  `tipo` enum('ingreso','traslado') NOT NULL,
  `status` enum('draft','pending_signature','signed','stamped','cancelled','error') NOT NULL DEFAULT 'draft',
  `rfc_emisor` varchar(13) NOT NULL,
  `nombre_emisor` varchar(255) NOT NULL,
  `regimen_fiscal` varchar(8) NOT NULL,
  `rfc_receptor` varchar(13) NOT NULL,
  `nombre_receptor` varchar(255) NOT NULL,
  `uso_cfdi` varchar(8) NOT NULL DEFAULT 'S01',
  `transp_internac` enum('Si','No') NOT NULL DEFAULT 'No',
  `entrada_salida_merc` enum('Entrada','Salida') NULL,
  `pais_origen_destino` varchar(8) NULL,
  `mercancias` json NOT NULL,
  `vehiculo` json NOT NULL,
  `figura_transporte` json NOT NULL,
  `ruta` json NOT NULL,
  `peso_total_kg` decimal(12,2) NOT NULL,
  `num_total_mercancias` int NOT NULL,
  `uuid` varchar(64) NULL,
  `sello_digital` text NULL,
  `cadena_original` text NULL,
  `fecha_timbrado` datetime NULL,
  `no_certificado` varchar(32) NULL,
  `xml_content` mediumtext NULL,
  `load_id` int NULL,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_carta_porte_load` (`load_id`),
  INDEX `idx_carta_porte_status` (`status`),
  INDEX `idx_carta_porte_rfc_emisor` (`rfc_emisor`),
  INDEX `idx_carta_porte_uuid` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── Pedimentos (Mexican Customs Declarations) ─────────────────────────────

CREATE TABLE IF NOT EXISTS `pedimentos` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `pedimento_id` varchar(64) NOT NULL UNIQUE,
  `numero_pedimento` varchar(24) NOT NULL,
  `tipo` enum('A1','A4','G1','IN','K1','V1','RT') NOT NULL,
  `status` enum('draft','pre_validated','submitted','paid','cleared','cancelled','rejected') NOT NULL DEFAULT 'draft',
  `fecha_entrada` datetime NOT NULL,
  `fecha_pago` datetime NULL,
  `importador_exportador` json NOT NULL,
  `agente_aduanal` json NOT NULL,
  `proveedor` json NULL,
  `destinatario` json NULL,
  `aduana_entrada` varchar(8) NOT NULL,
  `aduana_salida` varchar(8) NULL,
  `patente` varchar(8) NOT NULL,
  `seccion` varchar(4) NOT NULL DEFAULT '0',
  `mercancias` json NOT NULL,
  `peso_total_kg` decimal(12,2) NOT NULL,
  `num_bultos` int NOT NULL,
  `medio_transporte` enum('carretero','maritimo','aereo','ferroviario') NOT NULL,
  `placa_vehiculo` varchar(16) NULL,
  `num_contenedor` varchar(32) NULL,
  `valor_dolares` decimal(14,2) NOT NULL,
  `tipo_cambio` decimal(8,4) NOT NULL,
  `impuestos` json NOT NULL,
  `carta_porte_id` varchar(64) NULL,
  `emanifest_id` varchar(64) NULL,
  `factura_comercial` varchar(64) NULL,
  `certificado_origen` varchar(64) NULL,
  `load_id` int NULL,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_pedimento_load` (`load_id`),
  INDEX `idx_pedimento_status` (`status`),
  INDEX `idx_pedimento_numero` (`numero_pedimento`),
  INDEX `idx_pedimento_aduana` (`aduana_entrada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── Agentes Aduanales (Customs Brokers) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS `agentes_aduanales` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `agent_id` varchar(64) NOT NULL UNIQUE,
  `patente` varchar(8) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `rfc` varchar(13) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telefono` varchar(32) NULL,
  `aduanas_autorizadas` json NOT NULL,
  `especialidades` json NOT NULL,
  `status` enum('active','suspended','revoked','inactive') NOT NULL DEFAULT 'active',
  `domicilio` text NULL,
  `ciudad` varchar(128) NULL,
  `estado` varchar(8) NULL,
  `codigo_postal` varchar(8) NULL,
  `total_despachos` int NOT NULL DEFAULT 0,
  `tiempo_promedio_horas` decimal(8,2) NOT NULL DEFAULT 0,
  `calificacion` decimal(3,2) NOT NULL DEFAULT 0,
  `tarifa_base` decimal(12,2) NOT NULL DEFAULT 3000,
  `tarifa_por_partida` decimal(8,2) NOT NULL DEFAULT 150,
  `company_id` int NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_agente_patente` (`patente`),
  INDEX `idx_agente_status` (`status`),
  INDEX `idx_agente_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Broker Assignments ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `broker_assignments` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `assignment_id` varchar(64) NOT NULL UNIQUE,
  `agente_id` varchar(64) NOT NULL,
  `load_id` int NOT NULL,
  `pedimento_id` varchar(64) NULL,
  `carta_porte_id` varchar(64) NULL,
  `status` enum('pending','accepted','in_progress','documents_requested','cleared','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `tipo_operacion` enum('importacion','exportacion','transito') NOT NULL,
  `aduana_entrada` varchar(8) NOT NULL,
  `aduana_salida` varchar(8) NULL,
  `valor_mercancias` decimal(14,2) NOT NULL,
  `moneda` enum('USD','MXN') NOT NULL DEFAULT 'USD',
  `num_partidas` int NOT NULL,
  `es_hazmat` boolean NOT NULL DEFAULT false,
  `documentos_requeridos` json NOT NULL,
  `documentos_recibidos` json NOT NULL DEFAULT ('[]'),
  `cotizacion` json NULL,
  `notas` json NOT NULL DEFAULT ('[]'),
  `fecha_solicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_aceptacion` datetime NULL,
  `fecha_despacho` datetime NULL,
  `fecha_liberacion` datetime NULL,
  `created_by` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_broker_assign_load` (`load_id`),
  INDEX `idx_broker_assign_agente` (`agente_id`),
  INDEX `idx_broker_assign_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─── Mexican Insurance Policies ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `mexican_insurance_policies` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `policy_id` varchar(64) NOT NULL UNIQUE,
  `tipo_seguro` enum('responsabilidad_civil','danos_al_medio_ambiente','carga','ocupantes','danos_materiales') NOT NULL,
  `aseguradora` varchar(255) NOT NULL,
  `clave_aseguradora` varchar(16) NOT NULL,
  `numero_poliza` varchar(64) NOT NULL,
  `vigencia_inicio` date NOT NULL,
  `vigencia_fin` date NOT NULL,
  `suma_asegurada` decimal(14,2) NOT NULL,
  `moneda` enum('MXN','USD') NOT NULL DEFAULT 'MXN',
  `cobertura_geografica` enum('nacional','fronteriza','internacional') NOT NULL DEFAULT 'nacional',
  `vehiculos_amparados` json NOT NULL DEFAULT ('[]'),
  `conductores_amparados` json NULL,
  `hazmat_cubierto` boolean NOT NULL DEFAULT false,
  `deducible` decimal(12,2) NOT NULL DEFAULT 0,
  `company_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_mx_insurance_company` (`company_id`),
  INDEX `idx_mx_insurance_tipo` (`tipo_seguro`),
  INDEX `idx_mx_insurance_vigencia` (`vigencia_fin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Border Crossings Log ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `border_crossings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `crossing_id` varchar(64) NOT NULL UNIQUE,
  `driver_id` int NOT NULL,
  `load_id` int NULL,
  `from_country` enum('US','CA','MX') NOT NULL,
  `to_country` enum('US','CA','MX') NOT NULL,
  `port_of_entry` varchar(128) NOT NULL,
  `lat` decimal(10,6) NOT NULL,
  `lng` decimal(10,6) NOT NULL,
  `emanifest_id` varchar(64) NULL,
  `carta_porte_id` varchar(64) NULL,
  `pedimento_id` varchar(64) NULL,
  `hos_ruleset_before` varchar(64) NULL,
  `hos_ruleset_after` varchar(64) NULL,
  `crossing_time` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_crossing_driver` (`driver_id`),
  INDEX `idx_crossing_load` (`load_id`),
  INDEX `idx_crossing_time` (`crossing_time`),
  INDEX `idx_crossing_countries` (`from_country`, `to_country`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Exchange Rate Cache ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `exchange_rates` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `base_currency` enum('USD','CAD','MXN') NOT NULL,
  `target_currency` enum('USD','CAD','MXN') NOT NULL,
  `rate` decimal(12,6) NOT NULL,
  `source` enum('live','cached','fallback') NOT NULL DEFAULT 'live',
  `fetched_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_exchange_pair` (`base_currency`, `target_currency`),
  INDEX `idx_exchange_fetched` (`fetched_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
