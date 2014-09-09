CREATE TABLE Features (id int(11) NOT NULL, label varchar(64) NOT NULL, url varchar(256) DEFAULT NULL, type varchar(16) DEFAULT NULL, freq int(11) DEFAULT NULL, df int(11) DEFAULT NULL, PRIMARY KEY (id), KEY label_index (label), KEY url_index (url(255))) DEFAULT CHARSET=utf8
CREATE TABLE BagOfWords (goal_url varchar(240) NOT NULL, feat text, norm double DEFAULT NULL, PRIMARY KEY (goal_url)) DEFAULT CHARSET=utf8
CREATE TABLE BagOfTopics (goal_url varchar(240) NOT NULL, feat text, norm double DEFAULT NULL, PRIMARY KEY (goal_url)) DEFAULT CHARSET=utf8
CREATE TABLE SelfBagOfFeatures (goal_url varchar(240) NOT NULL, feat text, PRIMARY KEY (goal_url)) DEFAULT CHARSET=utf8
CREATE TABLE ContextBagOfFeatures (goal_url varchar(240) NOT NULL, feat text, norm double DEFAULT NULL, PRIMARY KEY (goal_url)) DEFAULT CHARSET=utf8
CREATE TABLE BagOfFeatures (goal_url varchar(240) NOT NULL, feat text, PRIMARY KEY (goal_url)) DEFAULT CHARSET=utf8
