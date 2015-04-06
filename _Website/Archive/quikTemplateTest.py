from quik import FileLoader

loader = FileLoader('../templates/tests')
template = loader.load_template('quikTemplate.html')
print template.render({'author': 'Thiago Avelino'},
                      loader=loader).encode('utf-8')