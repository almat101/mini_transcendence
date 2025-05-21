

export function buttonsHandler(startButton, cpuButton, tournamentButton, appear)
{
	console.log("%cButtons handler working 🖲️", "color: blue");
	if (!appear)
	{
		startButton.style.display = "none";
		cpuButton.style.display = "none";
		tournamentButton.style.display = "none";
	}
	else
	{
		startButton.style.display = "block";
		cpuButton.style.display = "block";
		tournamentButton.style.display = "block";
	}
}
