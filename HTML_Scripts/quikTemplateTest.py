from quik import FileLoader

loader = FileLoader('templates')
template = loader.load_template('quikTemplate.html')
print template.render({'author': 'Thiago Avelino'},
                      loader=loader).encode('utf-8')