#!usr/bin/python
'''
This script runs mass updates agains web api 

@author: teemu@toralab.org
'''
import os
import sys
import urllib
import urllib2, base64

# The command prefic contains some automatic name spaces
commandPrefix = """ PREFIX socia: <http://data.open-opinion.org/socia-ns#> 
 PREFIX dc: <http://purl.org/dc/terms/>
 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
 PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
 PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
 PREFIX owl: <http://www.w3.org/2002/07/owl#>
 PREFIX foaf: <http://xmlns.com/foaf/0.1/> """

commandUrl = "http://collab.open-opinion.org/sparql-auth"
graphUri = "http://collab.open-opinion.org"


def runFile(file):
    with open(file, "r")     as fileHandle:
        for line in fileHandle:
            url = {"query": commandPrefix + line, 
                   "format": "application/sparql-results+json",
                   "default-graph-uri": graphUri,
                   "timeout": 0,
                   "debug": "on" 
                   }
            result = os.system("wget -O - --header=\"Accept: text/html,application/sparql-results+json\" --http-user=socia --http-passwd=publicconcerns \"%s\"" % (commandUrl + "?%s" %urllib.urlencode(url)))
            print result

if __name__ == '__main__':
    # Parse arguments
    if len(sys.argv) != 2:
        print "Arguments error!!!!"
        print "usage: python MassUpdate.py dataFile.txt"
        exit()
    else:
        # Request confirmation
        resp = raw_input("Running file: " + sys.argv[1] + ". Is this correct y/n?")
        if resp == 'y':
            runFile(sys.argv[1])
        else:
            print "Exiting..."
            exit()
            



#             request = urllib2.Request(commandUrl + "?%s" %urllib.urlencode(url))
#             base64string = base64.encodestring("socia:publicconcerns").replace('\n', '')
#             request.add_header("Authorization", "Basic %s" % base64string) 
#             request.add_header("Accept", "text/html,application/sparql-results+json")
#             result = urllib2.urlopen(request)