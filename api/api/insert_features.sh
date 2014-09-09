#!/bin/bash

sudo cp goal_lda/feature.tsv /var/lib/mysql/Goalshare/
echo "Insert features..."
echo "set character_set_database=utf8; delete from Features; load data infile 'feature.tsv' into table Features fields terminated by '\t' lines terminated by '\n';" | mysql -u gsuser -pgoalshare Goalshare

echo "Insert word-topic matrix..."
cat goal_lda/word_topic_matrix.sql | mysql -u gsuser -pgoalshare Goalshare
