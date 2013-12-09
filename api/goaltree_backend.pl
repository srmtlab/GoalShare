use strict;


use DateTime;
use Date::Parse;
use DateTime::Format::Strptime;
use JSON;
use Try::Tiny;


sub getSubgoals{
	my $goalURI = $_[0];
	
	my $query = "PREFIX dc: <http://purl.org/dc/terms/>        
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/> 
select distinct *
 where {
     ?goal rdf:type socia:Goal;
       dc:title ?title.
       OPTIONAL { ?goal dc:description ?desc.      }
       OPTIONAL { ?goal dc:dateSubmitted ?submDate }
       OPTIONAL { ?goal socia:subGoalOf ?parentGoal }
       OPTIONAL { ?goal socia:requiredTargetDate ?requiredTargetDate }
       OPTIONAL { ?goal socia:desiredTargetDate ?desiredTargetDate }
       OPTIONAL { ?goal socia:completedDate ?completedDate }
       OPTIONAL { ?goal socia:status ?status    }
       OPTIONAL { ?goal dc:spatial ?locationURI}
       OPTIONAL { ?goal dc:creator ?creator}       
       OPTIONAL { ?goal socia:subGoalOf ?parentGoal }
       OPTIONAL {
GRAPH <http://collab.open-opinion.org>{
        OPTIONAL {?creator foaf:name ?creatorName.}
        OPTIONAL { ?creator foaf:img ?imageURI. }
        OPTIONAL { ?creator go:url ?fbURI. }
    }
       }
       OPTIONAL { GRAPH <http://collab.open-opinion.org>{?parentGoal dc:title ?parentGoalTitle }}
       
     FILTER ( ?parentGoal = <$goalURI>)
      }";
	#print $query;
    my $result_json = execute_sparql( $query );
	my $test = decode_json $result_json;
    my $result = [];
# Loop all subgoals to an array
for ( my $i = 0; $i < scalar @{$test->{'results'}->{'bindings'}}; $i++ ){
		print "\nChilds for :" . $goalURI . " " . $test->{results}->{bindings}[$i]->{goal}{value};
		my $tmp = {};
		$tmp->{cntSubGoals} = $test->{results}->{bindings}[$i]->{cntSubGoals}{value};
		#$tmp->{wishers} = [];
		$tmp->{goalURI} = $test->{results}->{bindings}[$i]->{goal}{value};
		$tmp->{title} = $test->{results}->{bindings}[$i]->{title}{value};
		$tmp->{description} = $test->{results}->{bindings}[$i]->{desc}{value};
		$tmp->{requiredTargetDate} = $test->{results}->{bindings}[$i]->{requiredTargetDate}{value};
		$tmp->{desiredTargetDate} = $test->{results}->{bindings}[$i]->{desiredTargetDate}{value};
		$tmp->{completedDate} = $test->{results}->{bindings}[$i]->{completedDate}{value};
		$tmp->{status} = $test->{results}->{bindings}[$i]->{status}{value};
		$tmp->{creator} = $test->{results}->{bindings}[$i]->{creator}{value};
		$tmp->{creatorURI} = $test->{results}->{bindings}[$i]->{creator}{value};
		$tmp->{creatorImageURI} = $test->{results}->{bindings}[$i]->{imageURI}{value};
		$tmp->{creatorName} = $test->{results}->{bindings}[$i]->{creatorName}{value};
		$tmp->{parentGoalURI} = $test->{results}->{bindings}[$i]->{parentGoal}{value};
		$tmp->{parentGoalTitle} = $test->{results}->{bindings}[$i]->{parentGoalTitle}{value};
		$tmp->{createdDate} = $test->{results}->{bindings}[$i]->{submDate}{value};
		$tmp->{dateTime} = $test->{results}->{bindings}[$i]->{submDate}{value};
		$tmp->{locationURI} = $test->{results}->{bindings}[$i]->{locationURI}{value};
		
		if( $tmp->{title} )
		{
			push(@{$result}, $tmp);
		}		
		#print $tmp->{goalURI} . " len :" . scalar @result;
}
return \$result;
}
sub fetchChilds{

	my $node = $_[0];
	print "\ngot node ". %{$node}->{goalURI};
	$node->{subgoals} = getSubgoals($node->{goalURI});
	
	for ( my $i = 0; $i < scalar @{$node->{subgoals}}; $i++ )
	{
		print "\nFetching :".$node->{subgoals}[$i]->{goalURI} ."\n";
		my $test = \%{$node->{subgoals}[$i]};
		print $test->{goalURI};
		#print $test->{goalURI};
		fetchChilds(\%{$node->{subgoals}[$i]});
		
		
	}
	
}
