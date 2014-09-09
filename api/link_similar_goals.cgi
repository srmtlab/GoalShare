#!/usr/bin/perl

require("sparql.pl");
require("goal_backend.pl");

use Time::HiRes qw(gettimeofday);

print "Access-Control-Allow-Origin: *\n";
#print "Content-Type: application/json; charset=UTF-8\n\n";
print "Content-Type: text/plain; charset=UTF-8\n\n";

$SPARQL_PREFIX =
    "PREFIX socia: <http://data.open-opinion.org/socia-ns#>\n". 
    "PREFIX dc: <http://purl.org/dc/terms/>\n".
    "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n".
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n".
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n".
    "PREFIX owl: <http://www.w3.org/2002/07/owl#>\n".
    "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n".
    "PREFIX schema: <http://schema.org/>\n";


my $q = CGI->new;
my @params = $q->param();

my $aninfo_class = "http://data.open-opinion.org/socia-ns#AnnotationInfo";


my $goal1_uri = uri_unescape($q->param("goal1")); 
my $goal2_uri = uri_unescape($q->param('goal2'));
my $similarity = uri_unescape($q->param('similarity'));
my $annotator = uri_unescape($q->param('annotator'));
#utf8::decode($goal1_uri);
#utf8::decode($goal2_uri);

print("goal1: $goal1_uri\n");
print("goal2: $goal2_uri\n");
print("similarity: $similarity\n");
print("annotator: $annotator\n");

my $graph_uri = "http://collab.open-opinion.org";


my $n3_link = "<$goal1_uri> schema:isSimilarTo <$goal2_uri>.\n
      <$goal2_uri> schema:isSimilarTo <$goal1_uri>.";

print "$n3_link\n\n";

my $result_link = insert_n3($n3_link, $graph_uri);

print "result_link: $result_link\n\n";


my $n3_aninfo = create_n3_aninfo($goal1_uri, $goal2_uri, $similarity, $annotator);


my $result_aninfo = insert_n3($n3_aninfo, $graph_uri);

print "result_aninfo: $result_aninfo\n\n";

my $result_json = "{\"result\":\"ok\"}";

print $result_json;

exit;



#------------

sub insert_n3 {
    my ($n3, $graph_uri) = @_;
    my $sparql = "${SPARQL_PREFIX}\n
      INSERT DATA INTO <$graph_uri> {$n3}";
    return execute_sparul($sparql);
}


sub create_n3_aninfo {
    my ($goal1_uri, $goal2_uri, $similarity, $annotator) = @_;
    my $millisec = get_millisec();
    print "millisec: $millisec\n";
    my $date_time = current_date_time();
    my $aninfo1_uri = "http://collab.open-opinion.org/resource/aninfo${millisec}_1"; 
    my $aninfo2_uri = "http://collab.open-opinion.org/resource/aninfo${millisec}_2";
    
    my $n3_aninfo = "<$aninfo1_uri> rdf:type <$aninfo_class>;\n
      socia:source <$goal1_uri>;\n
      socia:target <$goal2_uri>;\n
      socia:property schema:isSimilarTo;\n
      dc:created \"$date_time\"^^xsd:dateTime;\n
      socia:annotator <$annotator>;\n
      socia:weight \"$similarity\"^^xsd:float.\n\n

      <$aninfo2_uri> rdf:type <$aninfo_class>;\n
      socia:source <$goal2_uri>;\n
      socia:target <$goal1_uri>;\n
      socia:property schema:isSimilarTo;\n
      dc:created \"$date_time\"^^xsd:dateTime;\n
      socia:annotator <$annotator>;\n
      socia:weight \"$similarity\"^^xsd:float.\n";
    
    return $n3_aninfo;
}

sub current_date_time {
    my $tzhere = DateTime::TimeZone->new( name => "Asia/Tokyo" );
    my $dt = DateTime->now(time_zone => $tzhere);
    return $dt->strftime('%Y-%m-%dT%H:%M:%S+09:00');
}

sub get_millisec {
    my ($sec,$microsec) = gettimeofday();
    my $millisec = $sec * 1000 + int($microsec / 1000);
    return $millisec;
}
