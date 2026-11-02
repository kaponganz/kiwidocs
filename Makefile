build:
	mdbook build -d ./docs/
	python3 scripts_cld/gen_kiwiarc_spec.py
	mkdir -p docs/land/smartesad
	cp -r land/smartesad/* docs/land/smartesad/
	mkdir -p docs/land/h743-wing
	cp -r land/h743-wing/* docs/land/h743-wing/
	mkdir -p docs/land/initiation
	cp -r land/initiation/* docs/land/initiation/

s:
	mdbook serve -d ./docs/
