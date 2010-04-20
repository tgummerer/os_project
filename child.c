#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>


#include "child.h"
#include "def.h"

// command is closed by \0
int child (char command []) {
  // Execute command
  execlp (command, command, NULL);
  perror("Command was not found ");
  return EXIT_FAILURE;
}

