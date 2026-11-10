# Makefile for iut — the C side of the IUT data-type toolkit.
#
#   make            build ./iut (ncurses TUI if available, otherwise text-only)
#   make test       run the self-tests and the web-engine tests (node, against the wasm build in htdocs/engine)
#   make gen        regenerate docs/IDENTIFIERS.md (from src/iut_ids.c), docs/PROCESSES.md (from src/iut_proc.c), docs/GAPS.md (from src/iut_gaps.c)
#                   and htdocs/data/types.js (the struct forms, from the headers)
#   make engine     recompile src/ to WebAssembly → htdocs/engine/iut.wasm.js (needs clang + wasi-libc, see scripts/web/build-engine.sh)
#   make check      verify that the generated files are in sync with the C sources, and that the IUT_GAP("Id") marks match src/iut_gaps.c
#   make gui        build ./iut-gui, the graphical pipeline program (GTK 3 + Cairo, needs libgtk-3-dev / gtk+3)
#   make gui-check  build it and run `iut-gui --check` (headless: every example through every stage, compared with `iut pipeline`)
#   make clean

CC      ?= cc
CFLAGS  ?= -std=c11 -O2 -Wall -Wextra -Wno-unused-parameter
CPPFLAGS += -D_POSIX_C_SOURCE=200809L -D_DEFAULT_SOURCE
LDLIBS   = -lm

# ncurses detection: prefer ncursesw (UTF-8 box drawing), fall back to ncurses, else text-only.
CURSES_LIBS := $(shell pkg-config --libs ncursesw 2>/dev/null || pkg-config --libs ncurses 2>/dev/null)
CURSES_CFLAGS := $(shell pkg-config --cflags ncursesw 2>/dev/null || pkg-config --cflags ncurses 2>/dev/null)
ifeq ($(strip $(CURSES_LIBS)),)
  HAVE_CURSES := $(shell echo 'int main(void){return 0;}' | $(CC) -x c - -lncursesw -o /dev/null 2>/dev/null && echo yes)
  ifeq ($(HAVE_CURSES),yes)
    CURSES_LIBS := -lncursesw
  else
    HAVE_CURSES := $(shell echo 'int main(void){return 0;}' | $(CC) -x c - -lncurses -o /dev/null 2>/dev/null && echo yes)
    ifeq ($(HAVE_CURSES),yes)
      CURSES_LIBS := -lncurses
    endif
  endif
endif
ifeq ($(strip $(CURSES_LIBS)),)
  CPPFLAGS += -DIUT_NO_CURSES
  $(info ncurses not found: building text-only `iut` (TUI falls back to `iut walk`))
endif

SRC = iut_ids.c iut_core.c iut_lattice.c iut_json.c iut_view.c iut_main.c iut_tui.c iut_input.c iut_pipeline.c \
      iut_i.c iut_ops_i.c iut_ops_ii.c iut_ops_iii.c iut_ops_iv.c iut_ops_logic.c iut_proc.c iut_test_ops.c iut_gaps.c
OBJ = $(SRC:.c=.o)

all: iut

iut: $(OBJ)
	$(CC) $(CFLAGS) -o $@ $(OBJ) $(LDLIBS) $(CURSES_LIBS)

%.o: %.c iut.h iut_ops.h iut_i.h
	$(CC) $(CFLAGS) $(CPPFLAGS) $(CURSES_CFLAGS) -c -o $@ $<

test: iut
	./iut selftest
	@if command -v node >/dev/null 2>&1; then node ../htdocs/test.js; else echo "node not found: skipping web-engine tests"; fi

gen: iut
	./iut ids --md > ../docs/IDENTIFIERS.md
	./iut procs --md > ../docs/PROCESSES.md
	./iut gaps --md > ../docs/GAPS.md
	node ../scripts/web/gen-types.js

engine:
	../scripts/web/build-engine.sh

# ---- iut-gui (src/gui/): links the same library objects as iut, without the CLI's main and the TUI
GUI_SRC  = gui/gui_main.c gui/gui_model.c gui/gui_draw.c gui/gui_tree.c
GUI_OBJ  = $(GUI_SRC:.c=.o)
LIB_OBJ  = $(filter-out iut_main.o iut_tui.o,$(OBJ))
GTK_CFLAGS = $(shell pkg-config --cflags gtk+-3.0 2>/dev/null)
GTK_LIBS   = $(shell pkg-config --libs gtk+-3.0 2>/dev/null)

gui: iut-gui

iut-gui: $(GUI_OBJ) $(LIB_OBJ)
	@if [ -z "$(GTK_LIBS)" ]; then echo "iut-gui needs GTK 3 (Debian/Ubuntu: apt install libgtk-3-dev; macOS: brew install gtk+3)"; exit 1; fi
	$(CC) $(CFLAGS) -o $@ $(GUI_OBJ) $(LIB_OBJ) $(GTK_LIBS) $(LDLIBS)

gui/%.o: gui/%.c gui/gui.h gui/gui_draw.h gui/gui_tree.h iut.h iut_ops.h iut_i.h
	@if [ -z "$(GTK_CFLAGS)" ]; then echo "iut-gui needs GTK 3 (Debian/Ubuntu: apt install libgtk-3-dev; macOS: brew install gtk+3)"; exit 1; fi
	$(CC) $(CFLAGS) -Wno-deprecated-declarations $(CPPFLAGS) $(GTK_CFLAGS) -c -o $@ $<

gui-check: iut-gui
	./iut-gui --check

check: iut
	@./iut ids --md | diff -q - ../docs/IDENTIFIERS.md && echo "docs/IDENTIFIERS.md in sync"
	@./iut procs --md | diff -q - ../docs/PROCESSES.md && echo "docs/PROCESSES.md in sync"
	@./iut gaps --md | diff -q - ../docs/GAPS.md && echo "docs/GAPS.md in sync"
	@../scripts/check-gaps.sh
	@node ../scripts/web/gen-types.js --check && echo "htdocs/data/types.js in sync"

clean:
	rm -f $(OBJ) iut $(GUI_OBJ) iut-gui

.PHONY: all test gen engine check clean gui gui-check
