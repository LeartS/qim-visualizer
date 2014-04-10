import urllib2
import datetime
import csv
import os
from bs4 import BeautifulSoup

location = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))
url = 'http://www.matematicamente.it/gare/classifica/2/0'
soup = BeautifulSoup(urllib2.urlopen(url).read())
now_iso = datetime.datetime.now().isoformat()

scores = []
for row in soup.find('table', id='tab_classifica').find_all('tr')[1:]:
    fields = [s.encode('utf-8') for s in row.stripped_strings]
    scores.append(fields + [now_iso])

with open(os.path.join(location, 'data.csv'), 'a') as f:
    writer = csv.writer(f, delimiter='\t')
    writer.writerows(scores)

