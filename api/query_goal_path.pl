#!/usr/bin/perl

# Api for querying goal path

# INPUT parameters:
# goalURI

# OUTPUT
# TODO: Output JSONP
# Format: JSON 
# goalURI
# goalPath - string representation of the path from top goal to the current goal

use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;
use JSON;
use Try::Tiny;

require("sparql.pl");

# Configuration
my $graph_uri = "http://collab.open-opinion.org";
#$debug = true;# Uncomment this line to run in debug mode.

# End config

my $q = CGI->new;
my @params = $q->param();

# Parse parameters
my $goalURI = uri_unescape ( $q->param( 'goalURI' ) );

print "Access-Control-Allow-Origin: *\n";
print "Content-Type: application/json; charset=UTF-8\n\n";


	
$tmp = {};
$tmp->{'goalURI'} = $goalURI;

my $path = BuildPath( $goalURI );
$tmp->{goalPath} = $path;



# Return the result
my $js = new JSON;
print $js->pretty->encode( $tmp );
exit;
# END


sub BuildPath{
	my $workURI = $_[0];
	my @resultArray = ();
	my $index = 0;
	my $resultString = "";
	my $isFirst = 1;
	
	 
	while ( $workURI ){
		
		my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
select distinct ?goal ?title ?parentGoal
 where {
    ?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal socia:subGoalOf  ?parentGoal }   
       FILTER ( ?goal = <$workURI>)}";
		try{
			my $temp = execute_sparql( $query );
			my $result_json = decode_json($temp);
			
			my %pathPoint = ();
			
			if($isFirst == 1 ){
				$isFirst = 0;
			}else{
				$resultString = " > " . $resultString		
			}
			$resultString = $result_json->{results}{bindings}[0]->{title}{value} . $resultString;
			$pathPoint->{index} = $index;
			$pathPoint->{title} = $result_json->{results}{bindings}[0]->{title}{value};
			$pathPoint->{URI} = $workURI;
			
			push(@resultArray, $pathPoint );
			#print $workURI . " " .$index."\n";
			$index = $index + 1;
			$workURI = $result_json->{results}{bindings}[0]->{parentGoal}{value};
		
		} catch {
			# Error ocurrend, end building the path
			$workURI = False;
		}
	}
	print $resultString
	return $resultString;
	#return @resultArray;
}
