build:
	mdbook build -d ./docs/
	mkdir -p docs/land/smartesad
	cp -r land/smartesad/* docs/land/smartesad/
	mkdir -p docs/land/h743-wing
	cp -r land/h743-wing/* docs/land/h743-wing/

s:
	mdbook serve -d ./docs/
