import { Denops } from "jsr:@denops/std@7.3.0";
import {
  bufexists,
  bufwinid,
  getbufline,
  setbufline,
  win_gotoid,
} from "jsr:@denops/std@7.3.0/function";
import * as mapping from "jsr:@denops/std@7.3.0/mapping";
import { is } from "jsr:@core/unknownutil@4.3.0";
import Diagon from "npm:diagonjs";

export async function main(denops: Denops): Promise<void> {
  const diagon = await Diagon.init();

  const translators = [
    "math",
    "sequence",
    "tree",
    "table",
    "grammar",
    "frame",
    "graphDAG",
  ] as const;

  const isTranslator = is.LiteralOneOf(translators);
  const previewBufName = "__DiagonOutput__";

  await denops.cmd(
    `command! -nargs=1 -complete=customlist,diagonps#translators Diagonps call denops#notify("${denops.name}", "translator", [<f-args>])`,
  );

  const openPreviewBuffer = async (denops: Denops): Promise<void> => {
    if (!await bufexists(denops, previewBufName)) {
      await denops.cmd(
        `new ${previewBufName} | setlocal buftype=nofile bufhidden=wipe noswapfile nowrap nocursorline`,
      );

      mapping.map(denops, "q", "<Cmd>bw<CR>", {
        mode: ["n"],
        buffer: true,
        silent: true,
        noremap: true,
      });

    } else {
      const winid = await bufwinid(denops, previewBufName);
      if (winid !== -1) {
        await win_gotoid(denops, winid);
      } else {
        await denops.cmd(`sb ${previewBufName}`);
      }
    }
  };

  denops.dispatcher = {
    async translator(translator: unknown): Promise<void> {
      if (!isTranslator(translator)) {
        console.error(`Invalid translator: ${translator}`);
        return;
      }

      const content = await getbufline(denops, "%", 1, "$");
      const output = diagon.translate[translator](content.join("\n"));

      const oldwinid = await bufwinid(denops, "%");
      await openPreviewBuffer(denops);
      await setbufline(denops, "%", 1, output.split("\n"));
      await win_gotoid(denops, oldwinid);
    },
  };
}
