# Makefile for iut — the C side of the IUT data-type toolkit.
#
#   make            build ./iut (ncurses TUI if available, otherwise text-only)
#   make test       run the self-tests and the web-app model tests (node)
#   make gen        regenerate htdocs/identifiers.js, docs/IDENTIFIERS.md (from src/iut_ids.c)
#                   and htdocs/processlist.js, docs/PROCESSES.md (from src/iut_proc.c)
#   make check      verify that the generated files are in sync with the C table
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

SRC = iut_ids.c iut_core.c iut_lattice.c iut_json.c iut_view.c iut_main.c iut_tui.c \
      iut_i.c iut_ops_i.c iut_ops_ii.c iut_ops_iii.c iut_ops_iv.c iut_ops_logic.c iut_proc.c iut_test_ops.c
OBJ = $(SRC:.c=.o)

all: iut

iut: $(OBJ)
	$(CC) $(CFLAGS) -o $@ $(OBJ) $(LDLIBS) $(CURSES_LIBS)

%.o: %.c iut.h iut_ops.h iut_i.h
	$(CC) $(CFLAGS) $(CPPFLAGS) $(CURSES_CFLAGS) -c -o $@ $<

test: iut
	./iut selftest
	@if command -v node >/dev/null 2>&1; then node ../htdocs/test.js; else echo "node not found: skipping web-app model tests"; fi

gen: iut
	./iut ids --js > ../htdocs/identifiers.js
	./iut ids --md > ../docs/IDENTIFIERS.md
	./iut procs --md > ../docs/PROCESSES.md
	./iut procs --js > ../htdocs/processlist.js

check: iut
	@./iut ids --js | diff -q - ../htdocs/identifiers.js && echo "htdocs/identifiers.js in sync"
	@./iut ids --md | diff -q - ../docs/IDENTIFIERS.md && echo "docs/IDENTIFIERS.md in sync"
	@./iut procs --md | diff -q - ../docs/PROCESSES.md && echo "docs/PROCESSES.md in sync"
	@./iut procs --js | diff -q - ../htdocs/processlist.js && echo "htdocs/processlist.js in sync"

clean:
	rm -f $(OBJ) iut

.PHONY: all test gen check clean
