-- ============================================================
-- SMART FARM DATABASE SCHEMA
-- MySQL 8.0+
-- ============================================================
 
DROP DATABASE IF EXISTS farm_db; 
CREATE DATABASE farm_db;
USE farm_db; 

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
 
-- ============================================================
-- 1. USER
-- ============================================================
CREATE TABLE `user` (
    user_id       INT             NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255)    NOT NULL,
    user_name     VARCHAR(150)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    user_type     ENUM('admin','operator','viewer') NOT NULL,
    last_login_at DATETIME        NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

 
 -- ============================================================
-- 2. PLANT_TYPE
-- ============================================================
CREATE TABLE plant_type (
    plant_type_id INT             NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100)    NOT NULL,
    description   TEXT            NULL,
    min_temp      DECIMAL(6,2)    NULL,
    max_temp      DECIMAL(6,2)    NULL,
    min_soil      DECIMAL(6,2)    NULL,
    max_soil      DECIMAL(6,2)    NULL,
    min_humidity  DECIMAL(6,2)    NULL,
    max_humidity  DECIMAL(6,2)    NULL,
    min_light     DECIMAL(10,2)   NULL,
    max_light     DECIMAL(10,2)   NULL,
 
    PRIMARY KEY (plant_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. ZONE
-- ============================================================
CREATE TABLE zone (
    zone_id           INT             NOT NULL AUTO_INCREMENT,
    name              VARCHAR(100)    NOT NULL,
    description       TEXT            NULL,
    area_size         DECIMAL(10,2)   NULL,
    number_of_device  INT             NOT NULL DEFAULT 0,
    number_of_plant   INT             NOT NULL DEFAULT 0,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    plant_type_id     INT             NULL,
    user_id           INT             NULL,
 
    PRIMARY KEY (zone_id),
 
    CONSTRAINT fk_zone_plant_type FOREIGN KEY (plant_type_id) REFERENCES plant_type(plant_type_id) 
    ON UPDATE CASCADE ON DELETE SET NULL,
            
    CONSTRAINT fk_zone_user FOREIGN KEY (user_id) REFERENCES `user`(user_id)
	ON UPDATE CASCADE ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3.5. ZONE_PERMISSION
-- Links operators to zones they can manage
-- ============================================================
CREATE TABLE zone_permission (
    permission_id     INT             NOT NULL AUTO_INCREMENT,
    zone_id           INT             NOT NULL,
    user_id           INT             NOT NULL,
    assigned_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by       INT             NOT NULL,
 
    PRIMARY KEY (permission_id),
    UNIQUE KEY uq_zone_user (zone_id, user_id),
    INDEX idx_zone_permissions (zone_id),
    INDEX idx_user_zones (user_id),
 
    CONSTRAINT fk_zp_zone FOREIGN KEY (zone_id) REFERENCES zone(zone_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_zp_user FOREIGN KEY (user_id) REFERENCES `user`(user_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_zp_assigned_by FOREIGN KEY (assigned_by) REFERENCES `user`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. DEVICE_TYPE
-- ============================================================
CREATE TABLE device_type (
    device_type_id INT             NOT NULL AUTO_INCREMENT,
    name           VARCHAR(100)    NOT NULL,
    code           VARCHAR(10)     NOT NULL,
    category       ENUM('sensor','control') NOT NULL,
    protocol       VARCHAR(20)     NOT NULL DEFAULT 'MQTT',
 
    PRIMARY KEY (device_type_id),
    UNIQUE KEY uq_device_type_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 5. DEVICE_TYPE_COMMAND
-- ============================================================
CREATE TABLE device_type_command (
    command_id        INT             NOT NULL AUTO_INCREMENT,
    device_type_id    INT             NOT NULL,
    command_key       VARCHAR(50)     NOT NULL,
    payload_on        VARCHAR(50)     NULL,
    payload_off       VARCHAR(50)     NULL,
    payload_template  VARCHAR(255)    NULL,
 
    PRIMARY KEY (command_id),
    UNIQUE KEY uq_dtc_type_key (device_type_id, command_key),
 
    CONSTRAINT fk_dtc_device_type FOREIGN KEY (device_type_id) REFERENCES device_type(device_type_id)
	ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. SENSOR_METRIC
-- Weak entity of DEVICE_TYPE
-- PK natural : (device_type_id, metric_key)
-- ============================================================
CREATE TABLE sensor_metric (
    sensor_metric_id  INT             NOT NULL AUTO_INCREMENT,
    device_type_id    INT             NOT NULL,
    metric_key        VARCHAR(50)     NOT NULL,
    display_name      VARCHAR(100)    NULL,
    unit              VARCHAR(20)     NULL,
    min_value         DECIMAL(10,4)   NULL,
    max_value         DECIMAL(10,4)   NULL,
 
    PRIMARY KEY (sensor_metric_id),
    UNIQUE KEY uq_sm_type_key (device_type_id, metric_key),
 
    CONSTRAINT fk_sm_device_type FOREIGN KEY (device_type_id) REFERENCES device_type(device_type_id)
	ON UPDATE CASCADE ON DELETE RESTRICT
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. DEVICE ( Table Per Type)
-- ============================================================
CREATE TABLE device (
    device_id          INT             NOT NULL AUTO_INCREMENT,
    zone_id            INT             NOT NULL,
    device_type_id     INT             NOT NULL,
    name               VARCHAR(150)    NOT NULL,
    serial_number      VARCHAR(100)    NULL,
    connection_status  ENUM('online','offline','error') NOT NULL DEFAULT 'offline',
    last_seen_at       DATETIME        NULL,
    is_active          TINYINT(1)      NOT NULL DEFAULT 1,
    created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 
    PRIMARY KEY (device_id),
 
    CONSTRAINT fk_device_zone FOREIGN KEY (zone_id) REFERENCES zone(zone_id)
	ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT fk_device_type FOREIGN KEY (device_type_id) REFERENCES device_type(device_type_id)
	ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 8. SENSOR_DEVICE (category = sensor)
-- ============================================================
CREATE TABLE sensor_device (
    device_id          INT             NOT NULL,
    read_interval_sec  INT             NOT NULL DEFAULT 30,
 
    PRIMARY KEY (device_id),
 
    CONSTRAINT fk_sd_device FOREIGN KEY (device_id) REFERENCES device(device_id)
	ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 9. CONTROL_DEVICE (category = control)
-- ============================================================
CREATE TABLE control_device (
    device_id             INT             NOT NULL,
    control_channel       VARCHAR(5)      NOT NULL,
    control_params        JSON            NULL,
    current_state         ENUM('on','off') NOT NULL DEFAULT 'off',
    manual_override_until DATETIME        NULL,
 
    PRIMARY KEY (device_id),
 
    CONSTRAINT fk_cd_device FOREIGN KEY (device_id) REFERENCES device(device_id)
	ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
-- 10. CHANNEL_ASSIGNMENT
-- Ternary: SENSOR_DEVICE × SENSOR_METRIC → OhStem V1-V20
-- ============================================================
CREATE TABLE channel_assignment (
    assignment_id     INT             NOT NULL AUTO_INCREMENT,
    device_id         INT             NOT NULL,
    sensor_metric_id  INT             NOT NULL,
    channel_name      VARCHAR(5)      NOT NULL,
    is_active         TINYINT(1)      NOT NULL DEFAULT 1,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    PRIMARY KEY (assignment_id),
    UNIQUE KEY uq_ca_channel (channel_name),
    UNIQUE KEY uq_ca_device_metric (device_id, sensor_metric_id),
 
    CONSTRAINT fk_ca_sensor_device FOREIGN KEY (device_id) REFERENCES sensor_device(device_id)
	ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT fk_ca_sensor_metric FOREIGN KEY (sensor_metric_id) REFERENCES sensor_metric(sensor_metric_id)
	ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
 -- ============================================================
-- 11. SENSOR_DATA
-- ============================================================
CREATE TABLE sensor_data (
    data_id           BIGINT          NOT NULL AUTO_INCREMENT,
    device_id         INT             NOT NULL,
    sensor_metric_id  INT             NOT NULL,
    assignment_id     INT             NULL,
    raw_value         VARCHAR(50)     NULL,
    value             DECIMAL(10,4)   NOT NULL,
    recorded_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    PRIMARY KEY (data_id),
    INDEX idx_sdata_device_metric_time (device_id, sensor_metric_id, recorded_at DESC),
    INDEX idx_sdata_recorded_at (recorded_at DESC),
 
    CONSTRAINT fk_sdata_sensor_device FOREIGN KEY (device_id) REFERENCES sensor_device(device_id)
	ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT fk_sdata_sensor_metric FOREIGN KEY (sensor_metric_id) REFERENCES sensor_metric(sensor_metric_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT fk_sdata_assignment FOREIGN KEY (assignment_id) REFERENCES channel_assignment(assignment_id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
-- 12. SENSOR_LATEST_VALUE
-- Cache lasted value of sensor data — UPSERT after get data
-- ============================================================
CREATE TABLE sensor_latest_value (
    device_id         INT             NOT NULL,
    sensor_metric_id  INT             NOT NULL,
    assignment_id     INT             NULL,
    raw_value         VARCHAR(50)     NULL,
    latest_value      DECIMAL(10,4)   NOT NULL,
    recorded_at       DATETIME        NOT NULL,
 
    PRIMARY KEY (device_id, sensor_metric_id),
 
    CONSTRAINT fk_slv_sensor_device FOREIGN KEY (device_id) REFERENCES sensor_device(device_id)
	ON UPDATE CASCADE ON DELETE CASCADE,
    
    CONSTRAINT fk_slv_sensor_metric FOREIGN KEY (sensor_metric_id) REFERENCES sensor_metric(sensor_metric_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT fk_slv_assignment FOREIGN KEY (assignment_id)  REFERENCES channel_assignment(assignment_id)
	ON UPDATE CASCADE ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 13. ACTION ( disjoint specialization)
-- ============================================================
CREATE TABLE action (
    action_id         INT             NOT NULL AUTO_INCREMENT,
    action_type       ENUM('toggle','set_value','notify','control') NOT NULL,
    target_device_id  INT             NULL,
    command_id        INT             NULL,
    name              VARCHAR(150)    NULL,
    created_by        INT             NULL,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    PRIMARY KEY (action_id),
 
    CONSTRAINT fk_action_control_device FOREIGN KEY (target_device_id) REFERENCES control_device(device_id)
	ON UPDATE CASCADE ON DELETE SET NULL,
    
    CONSTRAINT fk_action_command FOREIGN KEY (command_id)  REFERENCES device_type_command(command_id)
	ON UPDATE CASCADE ON DELETE SET NULL,
    
    CONSTRAINT fk_action_user FOREIGN KEY (created_by)  REFERENCES `user`(user_id)
	ON UPDATE CASCADE ON DELETE SET NULL
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 14. ACTION_NOTIFY (action_type = notify)
-- ============================================================
CREATE TABLE action_notify (
    action_id     INT             NOT NULL,
    message       TEXT            NOT NULL,
    notify_level  ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
 
    PRIMARY KEY (action_id),
 
    CONSTRAINT fk_an_action FOREIGN KEY (action_id) REFERENCES action(action_id)
	ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 15. ACTION_SET_VALUE (action_type = set_value)
-- Use for RGB and LCD
-- ============================================================
CREATE TABLE action_set_value (
    action_id   INT             NOT NULL,
    brightness  TINYINT         NULL,
    color_hex   CHAR(7)         NULL,
    lcd_text    VARCHAR(255)    NULL,
 
    PRIMARY KEY (action_id),
 
    CONSTRAINT chk_asv_brightness CHECK (brightness BETWEEN 0 AND 100),
    CONSTRAINT fk_asv_action FOREIGN KEY (action_id) REFERENCES action(action_id)
	ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 16. ACTION_CONTROL (action_type = toggle/control)
-- Dùng cho máy bơm, relay, hoặc đèn bật/tắt nhen !!
-- ============================================================
CREATE TABLE action_control (
    action_id          INT             NOT NULL,
    duration_minute    INT             NULL,
    target_device_id   INT             NOT NULL,
    command_id         INT             NOT NULL,
 
    PRIMARY KEY (action_id),
 
    CONSTRAINT fk_ac_action FOREIGN KEY (action_id) REFERENCES action(action_id)
	ON UPDATE CASCADE ON DELETE CASCADE,
    
    CONSTRAINT fk_ac_control_device FOREIGN KEY (target_device_id) REFERENCES control_device(device_id)
	ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT fk_ac_command FOREIGN KEY (command_id) REFERENCES device_type_command(command_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 17. SCHEDULE
-- ============================================================
CREATE TABLE schedule (
    schedule_id   INT             NOT NULL AUTO_INCREMENT,
    zone_id       INT             NOT NULL,
    device_id     INT             NULL,
    name          VARCHAR(150)    NOT NULL,
    repeat_type   ENUM('daily','weekly','specific_date') NOT NULL,
    repeat_day    JSON            NULL,
    specific_day  DATE            NULL,
    start_time    TIME            NOT NULL,
    end_time      TIME            NULL,
    status        ENUM('active','paused') NOT NULL DEFAULT 'active',
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                  ON UPDATE CURRENT_TIMESTAMP,
 
    PRIMARY KEY (schedule_id),
    INDEX idx_schedule_status_time (status, start_time),
 
    CONSTRAINT fk_sch_zone FOREIGN KEY (zone_id) REFERENCES zone(zone_id)
            ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_sch_device FOREIGN KEY (device_id) REFERENCES device(device_id)
			ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 18. SCHEDULE_ACTION (N-N: SCHEDULE × ACTION)
-- ============================================================
CREATE TABLE schedule_action (
    schedule_id   INT             NOT NULL,
    action_id     INT             NOT NULL,
    action_order  INT             NOT NULL DEFAULT 1,
 
    PRIMARY KEY (schedule_id, action_id),
 
    CONSTRAINT fk_sa_schedule FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_sa_action FOREIGN KEY (action_id)  REFERENCES action(action_id)
            ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 19. THRESHOLD_RULE
-- (tạo trước ALERT vì có FK vòng — dùng ALTER TABLE sau)
-- ============================================================
CREATE TABLE threshold_rule (
    threshold_id      INT             NOT NULL AUTO_INCREMENT,
    zone_id           INT             NOT NULL,
    sensor_device_id  INT             NOT NULL,
    sensor_metric_id  INT             NOT NULL,
    name              VARCHAR(150)    NOT NULL,
    threshold_up      DECIMAL(10,2)   NULL,
    threshold_down    DECIMAL(10,2)   NULL,
    alert_level       ENUM('info','warning','critical') NOT NULL DEFAULT 'warning',
    status            ENUM('active','paused') NOT NULL DEFAULT 'active',
    cooldown_sec      INT             NOT NULL DEFAULT 300,
    last_trigger_at   DATETIME        NULL,
    current_alert_id  INT             NULL,       
    created_by        INT             NULL,
    created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,
 
    PRIMARY KEY (threshold_id),
    INDEX idx_tr_zone_sensor (zone_id, sensor_device_id, sensor_metric_id),
    INDEX idx_tr_status (status),
 
    CONSTRAINT chk_tr_threshold
        CHECK (threshold_up IS NOT NULL OR threshold_down IS NOT NULL),
    CONSTRAINT fk_tr_zone
        FOREIGN KEY (zone_id) REFERENCES zone(zone_id)
            ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tr_sensor_device
        FOREIGN KEY (sensor_device_id) REFERENCES sensor_device(device_id)
            ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tr_sensor_metric
        FOREIGN KEY (sensor_metric_id) REFERENCES sensor_metric(sensor_metric_id)
            ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_tr_user
        FOREIGN KEY (created_by) REFERENCES `user`(user_id)
            ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 20. ALERT
-- ============================================================
CREATE TABLE alert (
    alert_id          INT             NOT NULL AUTO_INCREMENT,
    threshold_rule_id INT             NOT NULL,
    sensor_value      DECIMAL(10,2)   NOT NULL,
    violated_bound    ENUM('upper','lower') NOT NULL,
    alert_level       ENUM('info','warning','critical') NOT NULL,
    status            ENUM('new','viewed','resolved') NOT NULL DEFAULT 'new',
    view_at           DATETIME        NULL,
    resolved_at       DATETIME        NULL,
    resolved_by       INT             NULL,
    triggered_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
    PRIMARY KEY (alert_id),
    INDEX idx_alert_status_time (status, triggered_at DESC),
    INDEX idx_alert_rule (threshold_rule_id),
 
    CONSTRAINT fk_alert_threshold_rule
        FOREIGN KEY (threshold_rule_id) REFERENCES threshold_rule(threshold_id)
            ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_alert_resolved_by
        FOREIGN KEY (resolved_by) REFERENCES `user`(user_id)
            ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- FK VÒNG: THRESHOLD_RULE → ALERT (current_alert_id)
-- Thêm sau khi cả 2 bảng đã được tạo
-- ============================================================
ALTER TABLE threshold_rule
    ADD CONSTRAINT fk_tr_current_alert
        FOREIGN KEY (current_alert_id) REFERENCES alert(alert_id)
            ON UPDATE CASCADE ON DELETE SET NULL;
 
-- ============================================================
-- 21. THRESHOLD_ACTION (N-N: THRESHOLD_RULE × ACTION)
-- ============================================================
CREATE TABLE threshold_action (
    threshold_id  INT             NOT NULL,
    action_id     INT             NOT NULL,
    action_order  INT             NOT NULL DEFAULT 1,
    trigger_on    ENUM('upper','lower','both') NOT NULL DEFAULT 'both',
 
    PRIMARY KEY (threshold_id, action_id),
 
    CONSTRAINT fk_ta_threshold
        FOREIGN KEY (threshold_id) REFERENCES threshold_rule(threshold_id)
            ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ta_action
        FOREIGN KEY (action_id)    REFERENCES action(action_id)
            ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ============================================================
-- 22. REPORT_CONFIG
-- ============================================================
CREATE TABLE report_config (
    report_id       INT             NOT NULL AUTO_INCREMENT,
    name            VARCHAR(255)    NOT NULL,
    description     TEXT            NULL,
    report_category VARCHAR(100)    NULL,
    group_by        VARCHAR(100)    NULL,
    date_range_type VARCHAR(50)     NULL,
    date_from       DATETIME        NULL,
    date_to         DATETIME        NULL,
    created_by      VARCHAR(100)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. REPORT_DATASET
-- ============================================================
CREATE TABLE report_dataset (
    dataset_id         INT             NOT NULL AUTO_INCREMENT,
    report_id          INT             NOT NULL,
    source_table       VARCHAR(100)    NOT NULL,
    sensor_metric_code VARCHAR(100)    NULL,
    event_category     VARCHAR(100)    NULL,
    event_type         VARCHAR(100)    NULL,
    alias              VARCHAR(100)    NULL,

    PRIMARY KEY (dataset_id),
    CONSTRAINT fk_rd_report FOREIGN KEY (report_id) REFERENCES report_config(report_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. REPORT_FILTER
-- ============================================================
CREATE TABLE report_filter (
    filter_id      INT             NOT NULL AUTO_INCREMENT,
    report_id      INT             NOT NULL,
    dataset_id     INT             NULL,
    filter_type    VARCHAR(50)     NOT NULL,
    field_name     VARCHAR(100)    NOT NULL,
    operator       VARCHAR(20)     NOT NULL,
    value_from     VARCHAR(255)    NULL,
    value_to       VARCHAR(255)    NULL,
    ref_id         INT             NULL,

    PRIMARY KEY (filter_id),
    CONSTRAINT fk_rf_report FOREIGN KEY (report_id) REFERENCES report_config(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_rf_dataset FOREIGN KEY (dataset_id) REFERENCES report_dataset(dataset_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 25. REPORT_METRIC
-- ============================================================
CREATE TABLE report_metric (
    metric_id     INT             NOT NULL AUTO_INCREMENT,
    report_id     INT             NOT NULL,
    dataset_id    INT             NOT NULL,
    display_name  VARCHAR(255)    NOT NULL,
    metric_code   VARCHAR(100)    NOT NULL,
    aggregation   VARCHAR(50)     NOT NULL,
    unit          VARCHAR(50)     NULL,
    color_hex     CHAR(7)         NULL,
    metric_order  INT             DEFAULT 0,

    PRIMARY KEY (metric_id),
    CONSTRAINT fk_rm_report FOREIGN KEY (report_id) REFERENCES report_config(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_rm_dataset FOREIGN KEY (dataset_id) REFERENCES report_dataset(dataset_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 26. REPORT_METRIC_CONDITION
-- ============================================================
CREATE TABLE report_metric_condition (
    condition_id    INT             NOT NULL AUTO_INCREMENT,
    metric_id       INT             NOT NULL,
    condition_order INT             DEFAULT 0,
    label           VARCHAR(100)    NULL,
    operator        VARCHAR(20)     NULL,
    value_from      DECIMAL(15,4)   NULL,
    value_to        DECIMAL(15,4)   NULL,
    color_hex       CHAR(7)         NULL,

    PRIMARY KEY (condition_id),
    CONSTRAINT fk_rmc_metric FOREIGN KEY (metric_id) REFERENCES report_metric(metric_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 27. REPORT_LAYOUT
-- ============================================================
CREATE TABLE report_layout (
    layout_id       INT             NOT NULL AUTO_INCREMENT,
    report_id       INT             NOT NULL,
    metric_id       INT             NULL,
    chart_type      VARCHAR(50)     NULL,
    widget_x        INT             NULL,
    widget_y        INT             NULL,
    widget_w        INT             NULL,
    widget_h        INT             NULL,
    x_axis          VARCHAR(100)    NULL,
    y_axis          VARCHAR(100)    NULL,
    show_legend     TINYINT(1)      DEFAULT 1,
    show_tooltip    TINYINT(1)      DEFAULT 1,
    show_data_label TINYINT(1)      DEFAULT 1,

    PRIMARY KEY (layout_id),
    CONSTRAINT fk_rl_report FOREIGN KEY (report_id) REFERENCES report_config(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_rl_metric FOREIGN KEY (metric_id) REFERENCES report_metric(metric_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 28. REPORT_INSTANCE
-- ============================================================
CREATE TABLE report_instance (
    instance_id     INT             NOT NULL AUTO_INCREMENT,
    report_id       INT             NOT NULL,
    date_from       DATETIME        NULL,
    date_to         DATETIME        NULL,
    result_summary  MEDIUMTEXT      NULL,
    row_count       INT             DEFAULT 0,
    status          VARCHAR(50)     NULL,
    generated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_by    VARCHAR(100)    NULL,

    PRIMARY KEY (instance_id),
    CONSTRAINT fk_ri_report FOREIGN KEY (report_id) REFERENCES report_config(report_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 29. REPORT_EXPORT
-- ============================================================
CREATE TABLE report_export (
    export_id       INT             NOT NULL AUTO_INCREMENT,
    instance_id     INT             NOT NULL,
    format          VARCHAR(20)     NOT NULL,
    file_name       VARCHAR(255)    NULL,
    file_path       VARCHAR(500)    NULL,
    exported_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exported_by     VARCHAR(100)    NULL,

    PRIMARY KEY (export_id),
    CONSTRAINT fk_re_instance FOREIGN KEY (instance_id) REFERENCES report_instance(instance_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================ 