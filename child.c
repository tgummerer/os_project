#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>


#include "child.h"
#include "def.h"
#include "parent.h" // for show_proc_list()

char * argv[MAX_COMMAND_LENGTH];
char * sep = " \t\n";
char * element;

// command is closed by \0
int child (char command []) {
  int argc=0;

  if (strcmp("jobs\n", command) == 0) {
    show_proc_list();
    exit (0);
  }
  
  element = strtok (command, sep);
  while (element != NULL)
    {
      argv[argc] = element;
      argc++;
      argv[argc]=NULL;
      element = strtok(NULL, sep);
    }
  
  // Execute command
  execvp (argv[0], argv);
  perror("Command was not found ");
  return EXIT_FAILURE;
}

