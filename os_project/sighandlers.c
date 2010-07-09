/**
 * @name        : sighandlers.c
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#include <signal.h>
#include <stdlib.h>
#include <stdio.h>

#include "sighandlers.h"

// Initializes the signal handlers
void sighandlers(void)
{
	if (signal(SIGINT, sigint_handler) == SIG_ERR) {
		perror("signal error");
		exit(1);
	}

	if (signal(SIGTSTP, sigtstp_handler) == SIG_ERR) {
		perror("signal error");
		exit(1);
	}
}

// Let the signals only take effect on the foreground process, and stop them befor they can take effect on the parrent process
// Quits the foreground process.
void sigint_handler (int sig)
{
	signal(SIGINT, sigint_handler);
}

// Stops the forground process temporarily
void sigtstp_handler (int sig)
{
	signal(SIGTSTP, sigtstp_handler);
}
