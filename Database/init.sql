DROP TABLE `subscription`;
DROP TABLE `channel`;

CREATE TABLE `channel` 
    ( `name`                VARCHAR(100)    NOT NULL COMMENT 'Name des Channels, der ihn zugleich eindeutig identifiziert', 
      `push_secret`         CHAR(50)        NOT NULL COMMENT 'Secret, welches benötigt wird, um in diesen Channel zu pushen',
      `icon_url`            VARCHAR(100)    NULL COMMENT 'Optionale URL zu einem Icon, welches in den Benachrichtigungen angezeigt wird', 
      `subscription_secret` VARCHAR(40)     NULL COMMENT 'Secret, welches benötigt wird, um diesen Channel zu abonnieren', 
      `creation_timestamp`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Zeitpunkt, an dem dieser Channel erstellt wurde',
      `last_push_timestamp` TIMESTAMP       NULL     DEFAULT NULL COMMENT 'Zeitpunkt, an dem zuletzt etwas in diesen Channel gepushed wurde',
       PRIMARY KEY (`name`)
    ) ENGINE = InnoDB COMMENT = 'Enthält sämtliche Push-Channels';

CREATE TABLE `subscription` 
    ( `token`               CHAR(45)        NOT NULL COMMENT 'Einzigartiges Subscription-Token',
      `channel_name`        VARCHAR(100)    NOT NULL COMMENT 'Channe-Name, auf den sich diese Subscription bezieht',
      `name`                VARCHAR(100)    NULL COMMENT 'Optionaler Anzeigename dieser Subscription',
      `delivery_details`    TEXT            NOT NULL COMMENT 'JSON-Objekt mit allen Informationen, die benötigt werden, um Push-Benachrichtigungen an den Client zuzustellen',
      `creation_timestamp`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Zeitpunkt, an dem diese Subscription erstellt wurde', 
      PRIMARY KEY (`token`)
    ) ENGINE = InnoDB COMMENT = 'Enthält sämtliche Subscriptions';

ALTER TABLE `subscription` 
    ADD CONSTRAINT `fk_subscription_channel_name` 
    FOREIGN KEY (`channel_name`) REFERENCES `channel`(`name`) ON DELETE CASCADE ON UPDATE CASCADE;
