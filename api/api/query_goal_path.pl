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
no warnings 'utf8';
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
	
	my @stack = ();
	my $loop1 = 0;
	while ( $workURI && $loop1 < 10 ){
		$loop1 = $loop1 + 1;
		my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
select distinct ?goal ?title ?parentGoal
 where {
    ?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal socia:subGoalOf  ?parentGoal }   
       FILTER ( ?goal = <$workURI>)}";
		try{
			#print $workURI. "\n";
			my $temp = execute_sparql( $query );
			$result_json = decode_json($temp);
			
			
			if($isFirst == 1 ){
				$isFirst = 0;
			}else{
				$resultString = " > " . $resultString		
			}
			%pathPoint = Null;
			$pathPoint = ();
			$resultString = $result_json->{results}{bindings}[0]->{title}{value} . $resultString;
			
			$pathPoint->{index} = $index;
			$pathPoint->{title} = $result_json->{results}{bindings}[0]->{title}{value};
			$pathPoint->{URI} =  $result_json->{results}{bindings}[0]->{goal}{value}; 
			
			push(@stack, $pathPoint);
			
			#print $workURI . " " .$index."\n";
			$index = $index + 1;
			$workURI = $result_json->{results}{bindings}[0]->{parentGoal}{value};
			
		
		} catch {
			# Error ocurrend, end building the path
			$workURI = False;
		}
	}
	my $top = pop(@stack);
	my $stack_temp = $top;
	my @test =();
	my $loop = 0;	
	while(scalar(@stack)>0 && $loop < 10){
		
		$loop = $loop + 1;
		my $tmpElement = pop(@stack);
		#print STDERR "Looping goal [$loop] [$tmpElement->{URI}]";
		#print $tmpElement->{URI}. "\n"; 
		$stack_temp->{child} = {};
		$stack_temp->{child}->{title} = $tmpElement->{title}; 
		$stack_temp->{child}->{URI} = $tmpElement->{URI};
		$stack_temp->{child}->{index} = $tmpElement->{index};
		#$stack_temp = \%tmpElement;
		$stack_temp = $stack_temp->{child}
		
	}
	
	#print %{$top};
	#print $resultString
	#return $resultString;
	return $top;
	#return @resultArray;
}
