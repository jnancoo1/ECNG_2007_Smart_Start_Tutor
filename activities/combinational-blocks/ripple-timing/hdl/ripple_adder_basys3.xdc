## Basys 3 constraints for ripple_adder_basys3 (original ECNG 2007 SmartStart work)
set_property CFGBVS VCCO [current_design]
set_property CONFIG_VOLTAGE 3.3 [current_design]

## sw[0..15] -> operand A       led[0..15] -> sum
set sw_pins  {V17 V16 W16 W17 W15 V15 W14 W13 V2 T3 T2 R3 W2 U1 T1 R2}
set led_pins {U16 E19 U19 V19 W18 U15 U14 V14 V13 V3 W3 U3 P3 N3 P1 L1}
for {set i 0} {$i < 16} {incr i} {
    set_property -dict [list PACKAGE_PIN [lindex $sw_pins $i]  IOSTANDARD LVCMOS33] [get_ports [format {sw[%d]} $i]]
    set_property -dict [list PACKAGE_PIN [lindex $led_pins $i] IOSTANDARD LVCMOS33] [get_ports [format {led[%d]} $i]]
}

## Buttons: btnC = carry-in, btnL/btnR = choose operand B preset
set_property -dict {PACKAGE_PIN U18 IOSTANDARD LVCMOS33} [get_ports btnC]
set_property -dict {PACKAGE_PIN W19 IOSTANDARD LVCMOS33} [get_ports btnL]
set_property -dict {PACKAGE_PIN T17 IOSTANDARD LVCMOS33} [get_ports btnR]

## 7-segment display (active-low): seg[0..6] = CA..CG, dp = carry-out, an[0..3]
set seg_pins {W7 W6 U8 V8 U5 V5 U7}
set an_pins  {U2 U4 V4 W4}
for {set i 0} {$i < 7} {incr i} {
    set_property -dict [list PACKAGE_PIN [lindex $seg_pins $i] IOSTANDARD LVCMOS33] [get_ports [format {seg[%d]} $i]]
}
for {set i 0} {$i < 4} {incr i} {
    set_property -dict [list PACKAGE_PIN [lindex $an_pins $i] IOSTANDARD LVCMOS33] [get_ports [format {an[%d]} $i]]
}
set_property -dict {PACKAGE_PIN V7 IOSTANDARD LVCMOS33} [get_ports dp]

## Timing: the design is purely combinational, so use a VIRTUAL clock to make
## Vivado time the switch -> LED path. Try tightening -period to see slack shrink.
create_clock -name virt_clk -period 20.000
set_input_delay  -clock virt_clk 0 [get_ports {sw[*] btnC btnL btnR}]
set_output_delay -clock virt_clk 0 [get_ports {led[*] dp}]
