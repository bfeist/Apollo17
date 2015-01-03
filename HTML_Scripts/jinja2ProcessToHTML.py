#from jinja2 import Template
#template = Template('Hello {{ name }}!')
#print template.render(name='John Doe')

import csv

from jinja2 import Environment, PackageLoader
env = Environment(loader=PackageLoader('processToHTML', './templates'))
template = env.get_template('jinja2Testtemplate.html')
print template.render(var1='test1', var2='test2')

inputFilePath = "../Processing_Output/A17 master TEC and PAO manual merge.csv"
reader = csv.reader(open(inputFilePath, "rU"), delimiter='|')
csv_data = [ row for row in reader ]

print template.render( data=csv_data )