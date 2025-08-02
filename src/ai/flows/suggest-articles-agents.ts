// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview An AI agent that suggests relevant articles or agents based on the ticket's subject and description.
 *
 * - suggestArticlesAgents - A function that suggests relevant articles or agents.
 * - SuggestArticlesAgentsInput - The input type for the suggestArticlesAgents function.
 * - SuggestArticlesAgentsOutput - The return type for the suggestArticlesAgents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestArticlesAgentsInputSchema = z.object({
  subject: z.string().describe('The subject of the ticket.'),
  description: z.string().describe('The description of the ticket.'),
});
export type SuggestArticlesAgentsInput = z.infer<
  typeof SuggestArticlesAgentsInputSchema
>;

const SuggestArticlesAgentsOutputSchema = z.object({
  suggestedArticles: z
    .array(z.string())
    .describe('Suggested articles related to the ticket.'),
  suggestedAgents: z
    .array(z.string())
    .describe('Suggested agents who can handle the ticket.'),
});
export type SuggestArticlesAgentsOutput = z.infer<
  typeof SuggestArticlesAgentsOutputSchema
>;

export async function suggestArticlesAgents(
  input: SuggestArticlesAgentsInput
): Promise<SuggestArticlesAgentsOutput> {
  return suggestArticlesAgentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestArticlesAgentsPrompt',
  input: {schema: SuggestArticlesAgentsInputSchema},
  output: {schema: SuggestArticlesAgentsOutputSchema},
  prompt: `Given the following ticket subject and description, suggest relevant articles and agents who can handle the ticket.\n\nSubject: {{{subject}}}\nDescription: {{{description}}}\n\nSuggest at least 3 relevant articles and 2 agents. Return a JSON object with \"suggestedArticles\" and \"suggestedAgents\" fields. Each field is an array of strings.\n`,
});

const suggestArticlesAgentsFlow = ai.defineFlow(
  {
    name: 'suggestArticlesAgentsFlow',
    inputSchema: SuggestArticlesAgentsInputSchema,
    outputSchema: SuggestArticlesAgentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
