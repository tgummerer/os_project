/**
 * @name        : main.c
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>

#include "def.h"
#include "child.h"
#include "parent.h"
#include "sighandlers.h"


int main (int args, char ** argv)
{
	char command [MAX_COMMAND_LENGTH];
	pid_t pid;

	// Create Signalhandlers
	sighandlers();

	// Loop (nearly) forever
	for (;;) {
		printf("$ ");

		// Read a command from the console
		fgets(command, MAX_COMMAND_LENGTH, stdin);

		// exit, if the command is exit
		if (strcmp ("exit\n", command) == 0) {
			break;
		}
		else {
			// fork to execute new program
			pid = fork ();


			if (pid < 0) {
				printf("Fork failed, program exiting\n");
				break;

			} else if (pid == 0) {
				// Child in child.c
				child (command);
				exit(1); // end the child
			} else {
				// Parent in parent.c
				parent(pid);
			}
		}
	}
}
