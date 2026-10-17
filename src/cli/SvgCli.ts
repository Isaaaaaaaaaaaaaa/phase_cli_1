#!/usr/bin/env node

import { SvgEditor } from "../application/SvgEditor.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { FileSvgRepository } from "../infrastructure/FileSvgRepository.js";
import { CommandFactory } from "./CommandFactory.js";
import { SvgCliApplication } from "./SvgCliApplication.js";

const shapeFactory = new ShapeFactory();
const repository = new FileSvgRepository(shapeFactory);
const editor = new SvgEditor();
const commandFactory = new CommandFactory(
  shapeFactory,
  repository,
  editor.historyManager,
);

new SvgCliApplication(editor, commandFactory).run();
