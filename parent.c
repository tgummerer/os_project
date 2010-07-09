/**
 * @name        : parent.c
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

#include "parent.h"
#include "def.h"

// The parent process, keeping a list of all the child process, in foreground background, and sleeping.
void parent (pid_t pid)
{
	int status;	
	
	waitpid(pid, &status, WUNTRACED);
	if (WIFSTOPPED(status)){
		// Child stopped with ^Z
	} else if (WIFEXITED(status) || WIFSIGNALED(status) || WIFSTOPPED(status)) {
		// child stopped or killed, remove it from the list
	}  
}

