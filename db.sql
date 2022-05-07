-- `rank`.rank_guilds definition

CREATE TABLE `rank_guilds` (
  `id` varchar(32) NOT NULL,
  `name` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- `rank`.rank_activityboards definition

CREATE TABLE `rank_activityboards` (
  `id` varchar(32) NOT NULL,
  `name` varchar(128) DEFAULT NULL,
  `guild_id` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `activityboards_FK` (`guild_id`),
  CONSTRAINT `activityboards_FK` FOREIGN KEY (`guild_id`) REFERENCES `rank_guilds` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- `rank`.rank_activitylogs definition

CREATE TABLE `rank_activitylogs` (
  `activityboard_id` varchar(32) NOT NULL,
  `username` varchar(32) DEFAULT NULL,
  `user_id` varchar(32) NOT NULL,
  `last_voice_active_ts` bigint(20) DEFAULT NULL,
  `last_reaction_ts` bigint(20) DEFAULT NULL,
  `last_message_ts` bigint(20) DEFAULT NULL,
  `latest_activity_ts` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`activityboard_id`,`user_id`),
  CONSTRAINT `rank_activitylogs_ibfk_1` FOREIGN KEY (`activityboard_id`) REFERENCES `rank_activityboards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- `rank`.rank_chatleaderboards definition

CREATE TABLE `rank_chatleaderboards` (
  `id` varchar(32) NOT NULL,
  `name` varchar(128) DEFAULT NULL,
  `guild_id` varchar(32) NOT NULL,
  `last_reset_ts` bigint(20) DEFAULT NULL,
  `next_reset_time_offset` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `guild_id` (`guild_id`),
  CONSTRAINT `rank_chatleaderboards_ibfk_1` FOREIGN KEY (`guild_id`) REFERENCES `rank_guilds` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- `rank`.rank_chatscores definition

CREATE TABLE `rank_chatscores` (
  `username` varchar(32) DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `chatleaderboard_id` varchar(32) NOT NULL,
  `user_id` varchar(32) NOT NULL,
  PRIMARY KEY (`user_id`,`chatleaderboard_id`),
  KEY `chatleaderboard_id` (`chatleaderboard_id`),
  CONSTRAINT `rank_chatscores_ibfk_1` FOREIGN KEY (`chatleaderboard_id`) REFERENCES `rank_chatleaderboards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;