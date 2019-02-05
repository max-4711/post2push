DROP TABLE `subscription`;
DROP TABLE `channel`;
DROP TABLE `client`;

CREATE TABLE `channel` 
    ( `name`                VARCHAR(50)     NOT NULL COMMENT 'Name des Channels, der ihn zugleich eindeutig identifiziert', 
      `push_secret`         CHAR(50)        NOT NULL COMMENT 'Secret, welches benötigt wird, um in diesen Channel zu pushen',
      `icon_url`            VARCHAR(200)    NULL COMMENT 'Optionale URL zu einem Icon, welches in den Benachrichtigungen angezeigt wird', 
      `subscription_secret` VARCHAR(40)     NULL COMMENT 'Secret, welches benötigt wird, um diesen Channel zu abonnieren', 
      `creation_timestamp`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Zeitpunkt, an dem dieser Channel erstellt wurde',
      `last_push_timestamp` TIMESTAMP       NULL     DEFAULT NULL COMMENT 'Zeitpunkt, an dem zuletzt etwas in diesen Channel gepushed wurde',
       PRIMARY KEY (`name`)
    ) ENGINE = InnoDB COMMENT = 'Enthält sämtliche Push-Channels';

CREATE TABLE `client`
    ( `token`                   CHAR(45)        NOT NULL COMMENT 'Einzigartiges Client-Token',
      `name`                    VARCHAR(50)     NULL COMMENT 'Optionaler Anzeigename dieses Clients',
      `delivery_details`        TEXT            NOT NULL COMMENT 'JSON-Objekt mit allen Informationen, die benötigt werden, um Push-Benachrichtigungen an den Client zuzustellen',
      `modification_timestamp`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Zeitpunkt, an der Datensatz zuletzt bearbeitet wurde',
      PRIMARY KEY (`token`)
    ) ENGINE = InnoDB COMMENT = 'Enthält sämtliche Clients';

CREATE TABLE `subscription` 
    ( `token`                   CHAR(45)        NOT NULL COMMENT 'Einzigartiges Subscription-Token',
      `channel_name`            VARCHAR(50)     NOT NULL COMMENT 'Channe-Name, auf den sich diese Subscription bezieht',
      `client_token`            CHAR(45)        NOT NULL COMMENT 'Token des Clients, an den Nachrichten dieser Subscription zugestellt werden sollen',
      `creation_timestamp`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Zeitpunkt, an dem diese Subscription erstellt wurde', 
      PRIMARY KEY (`token`)
    ) ENGINE = InnoDB COMMENT = 'Enthält sämtliche Subscriptions';

ALTER TABLE `subscription` 
    ADD CONSTRAINT `fk_subscription_channel_name` 
    FOREIGN KEY (`channel_name`) REFERENCES `channel`(`name`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `subscription` 
    ADD CONSTRAINT `fk_subscription_client_token` 
    FOREIGN KEY (`client_token`) REFERENCES `client`(`token`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `client`
    ADD CONSTRAINT `uk_client_delivery_details`
    UNIQUE (`delivery_details`);

INSERT INTO `channel` (`name`       , `push_secret`          , `icon_url`                                                , `subscription_secret`   )
VALUES                ('TestChannel', 'TestChannelPushSecret', 'https://api.studio-4711.com/post2push/public/success.png', 'TestSubscriptionSecret')